package com.e6studio.android.model

import java.io.Serializable

data class PostItem(
    val id: Long,
    val previewUrl: String,
    val fileUrl: String,
    val fileExt: String,
    val rating: String,
    val score: Int,
    val tags: List<String>,
    val description: String = ""
) : Serializable {
    val tagsText: String get() = tags.take(8).joinToString(" ") { "#$it" }
    val isVideo: Boolean get() = fileExt.equals("webm", true) || fileExt.equals("mp4", true)
    val isGif: Boolean get() = fileExt.equals("gif", true)
    val isImage: Boolean get() = fileExt.lowercase() in setOf("jpg", "jpeg", "png", "webp", "gif", "bmp")
    val isPreviewable: Boolean get() = isVideo || isImage
}
