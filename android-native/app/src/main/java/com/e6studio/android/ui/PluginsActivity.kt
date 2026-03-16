package com.e6studio.android.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.e6studio.android.databinding.ActivityPluginsBinding
import com.e6studio.android.storage.LocalStore
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.Executors

class PluginsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPluginsBinding
    private lateinit var localStore: LocalStore
    private val executor = Executors.newSingleThreadExecutor()
    private val client = OkHttpClient()

    private val localAdapter = StringListAdapter { name ->
        val enabled = localStore.pluginEnabledMap()[name] == true
        localStore.setPluginEnabled(name, !enabled)
        renderLocal()
    }

    private val githubAdapter = StringListAdapter { _ -> }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPluginsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        localStore = LocalStore(this)

        binding.localPluginsList.layoutManager = LinearLayoutManager(this)
        binding.localPluginsList.adapter = localAdapter
        binding.githubPluginsList.layoutManager = LinearLayoutManager(this)
        binding.githubPluginsList.adapter = githubAdapter

        binding.closeBtn.setOnClickListener { finish() }

        renderLocal()
        loadGitHubPlugins()
    }

    private fun renderLocal() {
        val map = localStore.pluginEnabledMap()
        val labels = if (map.isEmpty()) {
            listOf("Плагинов пока нет")
        } else {
            map.entries.sortedBy { it.key }.map { (name, enabled) ->
                "${if (enabled) "✅" else "⬜"} $name"
            }
        }
        localAdapter.submit(labels)
    }

    private fun loadGitHubPlugins() {
        binding.status.text = "Поиск плагинов на GitHub..."
        executor.execute {
            runCatching {
                val req = Request.Builder()
                    .url("https://api.github.com/search/repositories?q=topic:E6-Plugin&per_page=10")
                    .build()
                client.newCall(req).execute().use { resp ->
                    if (!resp.isSuccessful) error("HTTP ${resp.code}")
                    val body = resp.body?.string().orEmpty()
                    val root = JSONObject(body)
                    val items = root.optJSONArray("items")
                    val list = mutableListOf<String>()
                    if (items != null) {
                        for (i in 0 until items.length()) {
                            val repo = items.getJSONObject(i)
                            list += repo.optString("full_name")
                        }
                    }
                    list
                }
            }.onSuccess { repos ->
                runOnUiThread {
                    binding.status.text = "GitHub плагины"
                    githubAdapter.submit(if (repos.isEmpty()) listOf("Плагины не найдены") else repos)
                }
            }.onFailure { err ->
                runOnUiThread {
                    binding.status.text = "Ошибка загрузки"
                    githubAdapter.submit(listOf("Ошибка: ${err.message}"))
                    Toast.makeText(this, "GitHub plugins error", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        executor.shutdownNow()
    }
}
