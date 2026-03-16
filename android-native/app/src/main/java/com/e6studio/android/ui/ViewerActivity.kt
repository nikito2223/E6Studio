package com.e6studio.android.ui

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.widget.MediaController
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import coil.load
import com.e6studio.android.R
import com.e6studio.android.databinding.ActivityViewerBinding
import com.e6studio.android.model.PostItem
import com.e6studio.android.storage.LocalStore

class ViewerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityViewerBinding
    private lateinit var localStore: LocalStore
    private var post: PostItem? = null

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

        if (item.isVideo) {
            binding.viewerImage.visibility = android.view.View.GONE
            binding.viewerVideo.visibility = android.view.View.VISIBLE

            val mediaController = MediaController(this)
            mediaController.setAnchorView(binding.viewerVideo)
            binding.viewerVideo.setMediaController(mediaController)
            binding.viewerVideo.setVideoURI(Uri.parse(item.fileUrl))
            binding.viewerVideo.setOnPreparedListener {
                it.isLooping = true
                binding.viewerVideo.start()
            }
        } else {
            binding.viewerVideo.visibility = android.view.View.GONE
            binding.viewerImage.visibility = android.view.View.VISIBLE
            binding.viewerImage.load(item.fileUrl.ifBlank { item.previewUrl }) {
                placeholder(R.drawable.placeholder_bg)
                error(R.drawable.placeholder_bg)
            }
        }

        binding.description.text = item.description.ifBlank { "Описание отсутствует" }
        binding.tags.text = item.tagsText
        binding.stats.text = "ID #${item.id} · ${item.rating.uppercase()} · ❤ ${item.score}"

        renderFav(localStore.favorites().contains(item.id))

        binding.favoriteBtn.setOnClickListener {
            val added = localStore.toggleFavorite(item.id)
            renderFav(added)
        }

        binding.downloadBtn.setOnClickListener { enqueueDownload(item) }
        binding.closeBtn.setOnClickListener { finish() }
    }

    override fun onPause() {
        super.onPause()
        if (::binding.isInitialized && binding.viewerVideo.visibility == android.view.View.VISIBLE) {
            binding.viewerVideo.pause()
        }
    }

    private fun enqueueDownload(item: PostItem) {
        val fileName = "e6_${item.id}.${item.fileExt.ifBlank { "jpg" }}"
        val request = DownloadManager.Request(Uri.parse(item.fileUrl))
            .setTitle(fileName)
            .setDescription("Скачивание из E6 Studio")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)

        val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        dm.enqueue(request)
        Toast.makeText(this, "Скачивание начато: $fileName", Toast.LENGTH_SHORT).show()
    }

    private fun renderFav(enabled: Boolean) {
        binding.favoriteBtn.text = if (enabled) "★ Избранное" else "☆ В избранное"
    }
}
