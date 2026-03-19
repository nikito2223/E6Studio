package com.e6studio.android.model

import java.io.Serializable

data class PostItem(
    val id: Long,
    val previewUrl: String,
    val sampleUrl: String,
    val fileUrl: String,
    val fileExt: String,
    val rating: String,
    val score: Int,
    val width: Int,
    val height: Int,
    val tags: List<String>,
    val description: String = ""
) : Serializable {
    val tagsText: String get() = tags.take(8).joinToString(" ") { "#$it" }
    val isVideo: Boolean get() = fileExt.equals("webm", true) || fileExt.equals("mp4", true)
    val isGif: Boolean get() = fileExt.equals("gif", true)
    val isImage: Boolean get() = fileExt.lowercase() in setOf("jpg", "jpeg", "png", "webp", "gif", "bmp")
    val isPreviewable: Boolean get() = isVideo || isImage
    val mimeType: String get() = when {
        isVideo && fileExt.equals("webm", true) -> "video/webm"
        isVideo -> "video/mp4"
        isGif -> "image/gif"
        fileExt.equals("png", true) -> "image/png"
        fileExt.equals("webp", true) -> "image/webp"
        fileExt.equals("bmp", true) -> "image/bmp"
        else -> "image/jpeg"
    }
    val openMimeType: String get() = when {
        isVideo -> "video/*"
        isGif -> "image/gif"
        else -> "image/*"
    }
    val displayResolution: String get() = if (width > 0 && height > 0) "${width}×${height}" else "Размер неизвестен"
    val bestImageUrl: String get() = fileUrl.ifBlank { sampleUrl.ifBlank { previewUrl } }
    val mediumImageUrl: String get() = sampleUrl.ifBlank { previewUrl.ifBlank { fileUrl } }
}
