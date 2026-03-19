package com.e6studio.android.ui

import android.Manifest
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.RenderEffect
import android.graphics.Shader
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.media.MediaScannerConnection
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
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import coil.ImageLoader
import coil.decode.GifDecoder
import coil.decode.ImageDecoderDecoder
import coil.load
import coil.network.okhttp.okHttpClient
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
import java.io.InputStream
import java.util.concurrent.Executors

@UnstableApi
class ViewerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityViewerBinding
    private lateinit var localStore: LocalStore
    private var post: PostItem? = null
    private val downloadExecutor = Executors.newSingleThreadExecutor()
    private val httpClient = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
                .header("User-Agent", USER_AGENT)
                .build()
            chain.proceed(request)
        }
        .build()
    private val imageLoader by lazy {
        ImageLoader.Builder(this)
            .okHttpClient(httpClient)
            .allowHardware(false)
            .components {
                add(ImageDecoderDecoder.Factory())
                add(GifDecoder.Factory())
            }
            .build()
    }
    private var player: ExoPlayer? = null
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
        binding.viewerPlayer.setShutterBackgroundColor(palette.surface)

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
        clearPlayer()
        when {
            item.isVideo -> showVideo(item, videoSource(item))
            item.isImage -> showImage(item, imageSource(item))
            else -> showUnsupportedPreview(item)
        }
    }

    private fun showVideo(item: PostItem, source: String) {
        binding.viewerImage.visibility = View.GONE
        binding.viewerPlayer.visibility = View.VISIBLE
        binding.qualityBtn.visibility = View.VISIBLE
        binding.soundBtn.visibility = View.VISIBLE
        binding.fullscreenBtn.visibility = View.VISIBLE
        binding.downloadStatusText.text = "Видео: ${videoQuality.title} · ${item.fileExt.uppercase()}"

        val mimeType = when {
            item.fileExt.equals("webm", true) -> MimeTypes.VIDEO_WEBM
            item.fileExt.equals("mp4", true) -> MimeTypes.VIDEO_MP4
            else -> MimeTypes.APPLICATION_MP4
        }
        val mediaItem = MediaItem.Builder()
            .setUri(source)
            .setMimeType(mimeType)
            .build()
        val player = ExoPlayer.Builder(this)
            .setMediaSourceFactory(
                androidx.media3.exoplayer.source.DefaultMediaSourceFactory(
                    DefaultHttpDataSource.Factory()
                        .setUserAgent(USER_AGENT)
                        .setAllowCrossProtocolRedirects(true)
                )
            )
            .build().also { exo ->
                exo.repeatMode = Player.REPEAT_MODE_ONE
                exo.setMediaItem(mediaItem)
                exo.prepare()
                exo.playWhenReady = !isEmergencyMode
                exo.volume = if (isMuted) 0f else 1f
                exo.addListener(object : Player.Listener {
                    override fun onPlayerError(error: PlaybackException) {
                        updateDownloadUiError("Видео не воспроизводится: ${error.errorCodeName}")
                    }
                })
            }
        this.player = player
        binding.viewerPlayer.player = player
        binding.viewerPlayer.setControllerShowTimeoutMs(2500)
        binding.viewerPlayer.controllerAutoShow = true
        binding.viewerPlayer.setShowNextButton(false)
        binding.viewerPlayer.setShowPreviousButton(false)
        binding.viewerPlayer.setShowSubtitleButton(false)
        binding.viewerPlayer.setShowVrButton(false)
        binding.viewerPlayer.setShowShuffleButton(false)
    }

    private fun showImage(item: PostItem, source: String) {
        binding.viewerPlayer.visibility = View.GONE
        binding.viewerImage.visibility = View.VISIBLE
        binding.qualityBtn.visibility = View.VISIBLE
        binding.soundBtn.visibility = View.GONE
        binding.fullscreenBtn.visibility = View.VISIBLE
        binding.downloadStatusText.text = if (item.isGif) {
            "GIF · ${imageQuality.title}"
        } else {
            "Изображение: ${imageQuality.title} · ${item.fileExt.uppercase()}"
        }

        binding.viewerImage.load(source, imageLoader) {
            placeholder(R.drawable.placeholder_bg)
            error(R.drawable.placeholder_bg)
            crossfade(true)
            allowHardware(false)
        }
    }

    private fun showUnsupportedPreview(item: PostItem) {
        binding.viewerPlayer.visibility = View.GONE
        binding.viewerImage.visibility = View.VISIBLE
        binding.viewerImage.load(item.previewUrl, imageLoader) {
            placeholder(R.drawable.placeholder_bg)
            error(R.drawable.placeholder_bg)
        }
        binding.downloadStatusText.text = "Предпросмотр недоступен для ${item.fileExt.uppercase()}, но файл можно скачать"
        binding.qualityBtn.visibility = View.GONE
        binding.soundBtn.visibility = View.GONE
        binding.fullscreenBtn.visibility = View.GONE
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
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
        val fileUrl = downloadSource(item)
        if (fileUrl.isBlank()) {
            updateDownloadUiError("Для этого медиа нет прямой ссылки на скачивание")
            return
        }

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
                val request = Request.Builder().url(fileUrl).header("User-Agent", USER_AGENT).build()
                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) error("HTTP ${response.code}")
                    val body = response.body ?: error("Пустой ответ")
                    body.byteStream().use { stream ->
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            saveViaMediaStore(item, fileName, relativeDir, albumName, stream)
                        } else {
                            saveLegacy(item, fileName, relativeDir, albumName, stream)
                        }
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
        input: InputStream
    ): SavedResult {
        val collection = if (item.isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        val mimeType = item.mimeType
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
        input: InputStream
    ): SavedResult {
        val baseDir = Environment.getExternalStoragePublicDirectory(relativeDir)
        val targetDir = File(baseDir, albumName).apply { mkdirs() }
        val target = File(targetDir, fileName)
        FileOutputStream(target).use { output -> input.copyTo(output) }
        MediaScannerConnection.scanFile(this, arrayOf(target.absolutePath), arrayOf(item.mimeType), null)
        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", target)
        val openIntent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, item.openMimeType)
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
        VideoQuality.ORIGINAL -> item.fileUrl.ifBlank { item.sampleUrl.ifBlank { item.previewUrl } }
        VideoQuality.PREVIEW -> item.sampleUrl.ifBlank { item.fileUrl.ifBlank { item.previewUrl } }
    }

    private fun downloadSource(item: PostItem): String = when {
        item.fileUrl.isNotBlank() -> item.fileUrl
        item.sampleUrl.isNotBlank() -> item.sampleUrl
        else -> item.previewUrl
    }

    private fun toggleMute() {
        isMuted = !isMuted
        applyMuteState()
        updateSoundButton()
    }

    private fun applyMuteState() {
        player?.volume = if (isMuted) 0f else 1f
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
        binding.viewerPlayer.useController = post?.isVideo == true

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
        player?.pause()
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
        if (post?.isVideo == true) player?.play()
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

    override fun onStart() {
        super.onStart()
        if (!isEmergencyMode && post?.isVideo == true) player?.playWhenReady = true
    }

    override fun onDestroy() {
        clearPlayer()
        downloadExecutor.shutdownNow()
        super.onDestroy()
    }

    private fun clearPlayer() {
        binding.viewerPlayer.player = null
        player?.release()
        player = null
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

    private companion object {
        const val USER_AGENT = "E6Studio/1.2.1 (by rufik on e621)"
    }
}
