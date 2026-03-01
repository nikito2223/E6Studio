package com.e6studio.android.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.recyclerview.widget.GridLayoutManager
import com.e6studio.android.databinding.ActivityMainBinding
import com.e6studio.android.network.E621Client
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val adapter = PostAdapter { item ->
        Toast.makeText(this, item.fileUrl, Toast.LENGTH_SHORT).show()
    }

    private val networkExecutor = Executors.newSingleThreadExecutor()
    private val e621Client = E621Client()
    private var currentPage = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.recycler.layoutManager = GridLayoutManager(this, 2)
        binding.recycler.adapter = adapter

        binding.searchBtn.setOnClickListener {
            currentPage = 1
            loadPosts(reset = true)
        }

        binding.nextPageBtn.setOnClickListener {
            currentPage += 1
            loadPosts(reset = true)
        }

        binding.prevPageBtn.setOnClickListener {
            if (currentPage > 1) {
                currentPage -= 1
                loadPosts(reset = true)
            }
        }

        loadPosts(reset = true)
    }

    private fun loadPosts(reset: Boolean) {
        @Suppress("UNUSED_PARAMETER") val _ignore = reset
        val tags = binding.searchInput.text?.toString()?.trim().orEmpty().ifBlank { "order:score" }
        binding.progress.isVisible = true
        binding.pageLabel.text = currentPage.toString()

        networkExecutor.execute {
            runCatching {
                e621Client.loadPosts(tags = tags, page = currentPage)
            }.onSuccess { posts ->
                runOnUiThread {
                    binding.progress.isVisible = false
                    adapter.submitData(posts)
                    binding.emptyView.isVisible = posts.isEmpty()
                }
            }.onFailure { err ->
                runOnUiThread {
                    binding.progress.isVisible = false
                    binding.emptyView.isVisible = true
                    binding.emptyView.text = "Ошибка: ${err.message}"
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        networkExecutor.shutdownNow()
    }
}
