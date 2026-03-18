package com.e6studio.android.ui

import android.app.AlertDialog
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.widget.EditText
import android.widget.MediaController
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import coil.ImageLoader
import coil.decode.GifDecoder
import coil.decode.ImageDecoderDecoder
import coil.load
import com.e6studio.android.R
import com.e6studio.android.databinding.ActivityViewerBinding
import com.e6studio.android.model.PostItem
import com.e6studio.android.storage.LocalStore
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

class ViewerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityViewerBinding
    private lateinit var localStore: LocalStore
    private var post: PostItem? = null
    private val downloadExecutor = Executors.newSingleThreadExecutor()
    private val httpClient = OkHttpClient()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityViewerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        localStore = LocalStore(this)

        post = intent.getSerializableExtra("post") as? PostItem
        val item = post ?: run {
            finish()
            return
        }

        showMedia(item)

        binding.description.text = item.description.ifBlank { "Описание отсутствует" }
        binding.tags.text = item.tagsText
        binding.stats.text = "ID #${item.id} · ${item.rating.uppercase()} · ❤ ${item.score} · ${item.fileExt.uppercase()}"

        renderFav(localStore.favorites().contains(item.id))

        binding.favoriteBtn.setOnClickListener {
            val added = localStore.toggleFavorite(item.id)
            renderFav(added)
        }

        binding.downloadBtn.setOnClickListener { saveIntoAppDownloads(item) }
        binding.panicBtn.setOnClickListener { showEmergencyLock() }
        binding.closeBtn.setOnClickListener { finish() }
    }

    private fun showMedia(item: PostItem) {
        when {
            item.isVideo -> {
                binding.viewerImage.visibility = View.GONE
                binding.viewerVideo.visibility = View.VISIBLE
                binding.downloadStatusText.text = "Видео: ${item.fileExt.uppercase()}"

                val mediaController = MediaController(this)
                mediaController.setAnchorView(binding.viewerVideo)
                binding.viewerVideo.setMediaController(mediaController)
                binding.viewerVideo.setVideoURI(Uri.parse(item.fileUrl))
                binding.viewerVideo.setOnPreparedListener {
                    it.isLooping = true
                    binding.viewerVideo.start()
                }
            }
            item.isImage -> {
                binding.viewerVideo.visibility = View.GONE
                binding.viewerImage.visibility = View.VISIBLE
                binding.downloadStatusText.text = if (item.isGif) "GIF анимация" else "Изображение: ${item.fileExt.uppercase()}"

                val imageLoader = ImageLoader.Builder(this)
                    .components {
                        add(ImageDecoderDecoder.Factory())
                        add(GifDecoder.Factory())
                    }
                    .build()

                binding.viewerImage.load(item.fileUrl.ifBlank { item.previewUrl }, imageLoader) {
                    placeholder(R.drawable.placeholder_bg)
                    error(R.drawable.placeholder_bg)
                }
            }
            else -> {
                binding.viewerVideo.visibility = View.GONE
                binding.viewerImage.visibility = View.VISIBLE
                binding.viewerImage.load(item.previewUrl) {
                    placeholder(R.drawable.placeholder_bg)
                    error(R.drawable.placeholder_bg)
                }
                binding.downloadStatusText.text = "Предпросмотр недоступен для ${item.fileExt.uppercase()}, но файл можно скачать"
            }
        }
    }

    override fun onPause() {
        super.onPause()
        if (::binding.isInitialized && binding.viewerVideo.visibility == View.VISIBLE) {
            binding.viewerVideo.pause()
        }
    }

    private fun saveIntoAppDownloads(item: PostItem) {
        val fileName = "e6_${item.id}.${item.fileExt.ifBlank { "jpg" }}"
        val downloadsDir = File(filesDir, "downloads").apply { mkdirs() }
        val target = File(downloadsDir, fileName)

        binding.downloadStatusIcon.visibility = View.VISIBLE
        binding.downloadProgress.visibility = View.VISIBLE
        binding.downloadStatusIcon.setImageResource(android.R.drawable.stat_sys_download)
        binding.downloadStatusText.text = "Скачивается в ${target.absolutePath}"

        downloadExecutor.execute {
            runCatching {
                val request = Request.Builder().url(item.fileUrl).build()
                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) error("HTTP ${response.code}")
                    val body = response.body ?: error("Пустой ответ")
                    FileOutputStream(target).use { out ->
                        body.byteStream().copyTo(out)
                    }
                }
            }.onSuccess {
                runOnUiThread {
                    binding.downloadProgress.visibility = View.GONE
                    binding.downloadStatusIcon.setImageResource(android.R.drawable.stat_sys_download_done)
                    binding.downloadStatusText.text = "Сохранено: ${target.absolutePath}"
                    Toast.makeText(this, "Сохранено в папку приложения /files/downloads", Toast.LENGTH_LONG).show()
                }
            }.onFailure { err ->
                runOnUiThread {
                    binding.downloadProgress.visibility = View.GONE
                    binding.downloadStatusIcon.setImageResource(android.R.drawable.stat_notify_error)
                    binding.downloadStatusText.text = "Ошибка скачивания: ${err.message}"
                    Toast.makeText(this, "Ошибка скачивания", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun showEmergencyLock() {
        val password = localStore.appPassword()
        if (password.isBlank()) {
            Toast.makeText(this, "Сначала задайте пароль в настройках", Toast.LENGTH_LONG).show()
            return
        }

        if (binding.viewerVideo.visibility == View.VISIBLE) binding.viewerVideo.pause()
        val input = EditText(this)
        input.hint = "Введите пароль"
        input.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD

        val dialog = AlertDialog.Builder(this)
            .setTitle("Аварийная блокировка")
            .setMessage("Введите пароль для возврата")
            .setCancelable(false)
            .setView(input)
            .setPositiveButton("Разблокировать", null)
            .setNegativeButton("Закрыть приложение") { _, _ -> finishAffinity() }
            .create()

        dialog.setOnShowListener {
            val positive = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            positive.setOnClickListener {
                val entered = input.text?.toString().orEmpty()
                if (entered == password) {
                    dialog.dismiss()
                    if (post?.isVideo == true) binding.viewerVideo.start()
                } else {
                    input.error = "Неверный пароль"
                }
            }
        }
        dialog.show()
    }

    private fun renderFav(enabled: Boolean) {
        binding.favoriteBtn.text = if (enabled) "★ Избранное" else "☆ В избранное"
    }

    override fun onDestroy() {
        super.onDestroy()
        downloadExecutor.shutdownNow()
    }
}
