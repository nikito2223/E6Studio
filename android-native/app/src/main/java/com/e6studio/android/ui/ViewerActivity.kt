package com.e6studio.android.ui

import android.Manifest
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.RenderEffect
import android.graphics.Shader
import android.media.MediaPlayer
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import coil.ImageLoader
import coil.decode.GifDecoder
import coil.decode.ImageDecoderDecoder
import coil.load
import com.e6studio.android.R
import com.e6studio.android.databinding.ActivityViewerBinding
import com.e6studio.android.model.PostItem
import com.e6studio.android.storage.LocalStore
import com.e6studio.android.util.DownloadNotifier
import com.e6studio.android.util.NetworkUtils
import com.e6studio.android.util.ThemePalette
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
    private var currentMediaPlayer: MediaPlayer? = null
    private var isMuted = false
    private var isFullscreen = false
    private var isEmergencyMode = false
    private var imageQuality = ImageQuality.ORIGINAL
    private var videoQuality = VideoQuality.ORIGINAL

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val item = post ?: return@registerForActivityResult
        if (granted) {
            saveToGallery(item)
        } else {
            Toast.makeText(this, "Разрешение на запись отклонено", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityViewerBinding.inflate(layoutInflater)
        setContentView(binding.root)
        localStore = LocalStore(this)
        DownloadNotifier.ensureChannel(this)
        applyThemeUi(localStore.theme())

        post = intent.getSerializableExtra("post") as? PostItem
        val item = post ?: run {
            finish()
            return
        }

        showMedia(item)
        bindInfo(item)
        updateSoundButton()
        updateFullscreenUi()

        renderFav(localStore.favorites().contains(item.id))

        binding.favoriteBtn.setOnClickListener {
            val added = localStore.toggleFavorite(item.id)
            renderFav(added)
        }

        binding.downloadBtn.setOnClickListener { checkStoragePermissionAndSave(item) }
        binding.panicBtn.setOnClickListener { enterEmergencyMode() }
        binding.closeBtn.setOnClickListener { finish() }
        binding.soundBtn.setOnClickListener { toggleMute() }
        binding.fullscreenBtn.setOnClickListener { toggleFullscreen() }
        binding.qualityBtn.setOnClickListener { showQualityPicker(item) }
        binding.unlockEmergencyBtn.setOnClickListener { tryUnlockEmergencyMode() }
        binding.exitEmergencyBtn.setOnClickListener { finishAffinity() }
    }


    private fun applyThemeUi(theme: String) {
        val palette = ThemePalette.from(theme)
        binding.viewerRoot.setBackgroundColor(palette.mainBg)
        binding.contentRoot.setBackgroundColor(palette.mainBg)
        binding.mediaFrame.background?.setTint(palette.surface)
        binding.infoPanel.background?.setTint(palette.surface)
        binding.downloadStatusRow.background?.setTint(palette.surfaceAlt)
        binding.emergencyOverlay.background?.setTint(palette.mainBg)

        listOf(
            binding.closeBtn,
            binding.panicBtn,
            binding.downloadBtn,
            binding.qualityBtn,
            binding.soundBtn,
            binding.fullscreenBtn,
            binding.favoriteBtn,
            binding.unlockEmergencyBtn,
            binding.exitEmergencyBtn
        ).forEach { button ->
            button.setBackgroundColor(palette.accent)
            button.setTextColor(palette.accentText)
        }

        tintTextTree(binding.contentRoot, palette)
        binding.emergencyPasswordInput.background?.setTint(palette.surfaceAlt)
        binding.emergencyPasswordInput.setTextColor(palette.textPrimary)
        binding.emergencyPasswordInput.setHintTextColor(palette.textSecondary)
    }

    private fun tintTextTree(view: View, palette: ThemePalette) {
        when (view) {
            is TextView -> if (view !is Button && view !is EditText) view.setTextColor(palette.textPrimary)
            is EditText -> {
                view.setTextColor(palette.textPrimary)
                view.setHintTextColor(palette.textSecondary)
            }
        }
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) tintTextTree(view.getChildAt(i), palette)
        }
    }

    private fun bindInfo(item: PostItem) {
        binding.description.text = item.description.ifBlank { "Описание отсутствует" }
        binding.tags.text = item.tagsText.ifBlank { getString(R.string.no_tags) }
        binding.stats.text = "ID #${item.id} · ${item.rating.uppercase()} · ❤ ${item.score} · ${item.fileExt.uppercase()} · ${item.displayResolution}"
    }

    private fun showMedia(item: PostItem) {
        when {
            item.isVideo -> showVideo(item, videoSource(item))
            item.isImage -> showImage(item, imageSource(item))
            else -> {
                binding.viewerVideo.visibility = View.GONE
                binding.viewerImage.visibility = View.VISIBLE
                binding.viewerImage.load(item.previewUrl) {
                    placeholder(R.drawable.placeholder_bg)
                    error(R.drawable.placeholder_bg)
                }
                binding.downloadStatusText.text = "Предпросмотр недоступен для ${item.fileExt.uppercase()}, но файл можно скачать"
                binding.qualityBtn.visibility = View.GONE
                binding.soundBtn.visibility = View.GONE
                binding.fullscreenBtn.visibility = View.GONE
            }
        }
    }

    private fun showVideo(item: PostItem, source: String) {
        binding.viewerImage.visibility = View.GONE
        binding.viewerVideo.visibility = View.VISIBLE
        binding.qualityBtn.visibility = View.VISIBLE
        binding.soundBtn.visibility = View.VISIBLE
        binding.fullscreenBtn.visibility = View.VISIBLE
        binding.downloadStatusText.text = "Видео: ${videoQuality.title} · ${item.fileExt.uppercase()}"

        val mediaController = android.widget.MediaController(this)
        mediaController.setAnchorView(binding.viewerVideo)
        binding.viewerVideo.setMediaController(mediaController)
        binding.viewerVideo.setVideoURI(Uri.parse(source))
        binding.viewerVideo.setOnPreparedListener {
            currentMediaPlayer = it
            it.isLooping = true
            applyMuteState()
            if (!isEmergencyMode) binding.viewerVideo.start()
        }
    }

    private fun showImage(item: PostItem, source: String) {
        binding.viewerVideo.stopPlayback()
        binding.viewerVideo.visibility = View.GONE
        binding.viewerImage.visibility = View.VISIBLE
        binding.qualityBtn.visibility = View.VISIBLE
        binding.soundBtn.visibility = View.GONE
        binding.fullscreenBtn.visibility = View.VISIBLE
        binding.downloadStatusText.text = if (item.isGif) {
            "GIF · ${imageQuality.title}"
        } else {
            "Изображение: ${imageQuality.title} · ${item.fileExt.uppercase()}"
        }

        val imageLoader = ImageLoader.Builder(this)
            .components {
                add(ImageDecoderDecoder.Factory())
                add(GifDecoder.Factory())
            }
            .build()

        binding.viewerImage.load(source, imageLoader) {
            placeholder(R.drawable.placeholder_bg)
            error(R.drawable.placeholder_bg)
        }
    }

    override fun onPause() {
        super.onPause()
        if (::binding.isInitialized && binding.viewerVideo.visibility == View.VISIBLE) {
            binding.viewerVideo.pause()
        }
    }

    private fun checkStoragePermissionAndSave(item: PostItem) {
        if (!NetworkUtils.isOnline(this)) {
            updateDownloadUiError("Нет интернета. Подключитесь и повторите загрузку.")
            return
        }
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED
        ) {
            permissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            return
        }
        saveToGallery(item)
    }

    private fun saveToGallery(item: PostItem) {
        val fileName = "e6_${item.id}.${item.fileExt.ifBlank { if (item.isVideo) "mp4" else "jpg" }}"
        val notificationId = item.id.toInt()
        val relativeDir = Environment.DIRECTORY_PICTURES
        val albumName = "E6Studio"
        val humanPath = "$relativeDir/$albumName/$fileName"

        binding.downloadStatusIcon.visibility = View.VISIBLE
        binding.downloadProgress.visibility = View.VISIBLE
        binding.downloadStatusIcon.setImageResource(android.R.drawable.stat_sys_download)
        binding.downloadStatusText.text = "Скачивается в $humanPath"
        DownloadNotifier.showProgress(this, notificationId, "E6Studio", "Скачивается $fileName в $humanPath")

        downloadExecutor.execute {
            runCatching {
                val request = Request.Builder().url(item.fileUrl).build()
                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) error("HTTP ${response.code}")
                    val body = response.body ?: error("Пустой ответ")
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        saveViaMediaStore(item, fileName, relativeDir, albumName, body.byteStream())
                    } else {
                        saveLegacy(item, fileName, relativeDir, albumName, body.byteStream())
                    }
                }
            }.onSuccess { saved ->
                runOnUiThread {
                    binding.downloadProgress.visibility = View.GONE
                    binding.downloadStatusIcon.setImageResource(android.R.drawable.stat_sys_download_done)
                    binding.downloadStatusText.text = "Сохранено в $humanPath"
                    Toast.makeText(this, "Сохранено в $humanPath", Toast.LENGTH_LONG).show()
                    DownloadNotifier.showFinished(
                        this,
                        notificationId,
                        "Скачивание завершено",
                        "Нажмите, чтобы открыть $fileName",
                        saved.openIntent
                    )
                }
            }.onFailure { err ->
                runOnUiThread {
                    updateDownloadUiError("Ошибка скачивания: ${err.message}")
                    DownloadNotifier.showError(this, notificationId, "Ошибка загрузки", err.message ?: "Неизвестная ошибка")
                }
            }
        }
    }

    private fun saveViaMediaStore(
        item: PostItem,
        fileName: String,
        relativeDir: String,
        albumName: String,
        input: java.io.InputStream
    ): SavedResult {
        val collection = if (item.isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        val mimeType = when {
            item.isVideo -> if (item.fileExt.equals("webm", true)) "video/webm" else "video/mp4"
            item.isGif -> "image/gif"
            item.fileExt.equals("png", true) -> "image/png"
            item.fileExt.equals("webp", true) -> "image/webp"
            else -> "image/jpeg"
        }
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.RELATIVE_PATH, "$relativeDir/$albumName")
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val resolver = contentResolver
        val uri = resolver.insert(collection, values) ?: error("Не удалось создать запись MediaStore")
        resolver.openOutputStream(uri)?.use { output ->
            input.copyTo(output)
        } ?: error("Не удалось открыть поток записи")
        values.clear()
        values.put(MediaStore.MediaColumns.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
        val openIntent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, mimeType)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        return SavedResult(openIntent)
    }

    private fun saveLegacy(
        item: PostItem,
        fileName: String,
        relativeDir: String,
        albumName: String,
        input: java.io.InputStream
    ): SavedResult {
        val baseDir = Environment.getExternalStoragePublicDirectory(relativeDir)
        val targetDir = File(baseDir, albumName).apply { mkdirs() }
        val target = File(targetDir, fileName)
        FileOutputStream(target).use { output -> input.copyTo(output) }
        MediaScannerConnection.scanFile(this, arrayOf(target.absolutePath), null, null)
        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", target)
        val mimeType = if (item.isVideo) "video/*" else "image/*"
        val openIntent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, mimeType)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        return SavedResult(openIntent)
    }

    private fun updateDownloadUiError(message: String) {
        binding.downloadProgress.visibility = View.GONE
        binding.downloadStatusIcon.visibility = View.VISIBLE
        binding.downloadStatusIcon.setImageResource(android.R.drawable.stat_notify_error)
        binding.downloadStatusText.text = message
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun showQualityPicker(item: PostItem) {
        val options = if (item.isVideo) {
            arrayOf(VideoQuality.ORIGINAL.title, VideoQuality.PREVIEW.title)
        } else {
            arrayOf(ImageQuality.ORIGINAL.title, ImageQuality.PREVIEW.title)
        }
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Качество")
            .setItems(options) { _, which ->
                if (item.isVideo) {
                    videoQuality = if (which == 0) VideoQuality.ORIGINAL else VideoQuality.PREVIEW
                } else {
                    imageQuality = if (which == 0) ImageQuality.ORIGINAL else ImageQuality.PREVIEW
                }
                showMedia(item)
            }
            .show()
    }

    private fun imageSource(item: PostItem): String = when (imageQuality) {
        ImageQuality.ORIGINAL -> item.bestImageUrl
        ImageQuality.PREVIEW -> item.mediumImageUrl.ifBlank { item.bestImageUrl }
    }

    private fun videoSource(item: PostItem): String = when (videoQuality) {
        VideoQuality.ORIGINAL -> item.fileUrl
        VideoQuality.PREVIEW -> item.sampleUrl.ifBlank { item.previewUrl.ifBlank { item.fileUrl } }
    }

    private fun toggleMute() {
        isMuted = !isMuted
        applyMuteState()
        updateSoundButton()
    }

    private fun applyMuteState() {
        currentMediaPlayer?.setVolume(if (isMuted) 0f else 1f, if (isMuted) 0f else 1f)
    }

    private fun updateSoundButton() {
        binding.soundBtn.text = if (isMuted) "🔇 Без звука" else "🔊 Звук"
    }

    private fun toggleFullscreen() {
        if (isEmergencyMode) return
        isFullscreen = !isFullscreen
        updateFullscreenUi()
    }

    private fun updateFullscreenUi() {
        binding.topBar.visibility = if (isFullscreen) View.GONE else View.VISIBLE
        binding.secondaryControls.visibility = if (isFullscreen) View.GONE else View.VISIBLE
        binding.downloadStatusRow.visibility = if (isFullscreen) View.GONE else View.VISIBLE
        binding.infoPanel.visibility = if (isFullscreen) View.GONE else View.VISIBLE
        binding.favoriteBtn.visibility = if (isFullscreen) View.GONE else View.VISIBLE
        binding.fullscreenBtn.text = if (isFullscreen) "⤢ Выход" else "⛶ Full"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                if (isFullscreen) {
                    controller.hide(WindowInsets.Type.systemBars())
                    controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                } else {
                    controller.show(WindowInsets.Type.systemBars())
                }
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = if (isFullscreen) {
                View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            } else {
                View.SYSTEM_UI_FLAG_VISIBLE
            }
        }
    }

    private fun enterEmergencyMode() {
        val password = localStore.appPassword()
        if (password.isBlank()) {
            Toast.makeText(this, "Сначала задайте пароль в настройках", Toast.LENGTH_LONG).show()
            return
        }
        isEmergencyMode = true
        if (binding.viewerVideo.visibility == View.VISIBLE) binding.viewerVideo.pause()
        binding.emergencyPasswordInput.setText("")
        binding.emergencyOverlay.visibility = View.VISIBLE
        applyEmergencyBlur(enabled = true)
    }

    private fun tryUnlockEmergencyMode() {
        val entered = binding.emergencyPasswordInput.text?.toString().orEmpty()
        if (entered != localStore.appPassword()) {
            binding.emergencyPasswordInput.error = "Неверный пароль"
            return
        }
        isEmergencyMode = false
        binding.emergencyOverlay.visibility = View.GONE
        applyEmergencyBlur(enabled = false)
        if (post?.isVideo == true) binding.viewerVideo.start()
    }

    private fun applyEmergencyBlur(enabled: Boolean) {
        val alpha = if (enabled) 0.35f else 1f
        binding.contentRoot.alpha = alpha
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            binding.contentRoot.setRenderEffect(
                if (enabled) RenderEffect.createBlurEffect(24f, 24f, Shader.TileMode.CLAMP) else null
            )
        }
    }

    private fun renderFav(enabled: Boolean) {
        binding.favoriteBtn.text = if (enabled) "★ Избранное" else "☆ В избранное"
    }

    override fun onDestroy() {
        currentMediaPlayer = null
        binding.viewerVideo.stopPlayback()
        downloadExecutor.shutdownNow()
        super.onDestroy()
    }

    private data class SavedResult(val openIntent: Intent?)

    private enum class ImageQuality(val title: String) {
        ORIGINAL("Оригинал"),
        PREVIEW("Быстрый preview")
    }

    private enum class VideoQuality(val title: String) {
        ORIGINAL("Оригинал"),
        PREVIEW("Быстрый preview")
    }
}
