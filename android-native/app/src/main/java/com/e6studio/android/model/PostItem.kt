package com.e6studio.android.model

import java.io.Serializable

data class PostItem(
    val id: Long,
    val previewUrl: String,
    val fileUrl: String,
    val rating: String,
    val score: Int,
    val tags: List<String>,
    val description: String = ""
) : Serializable {
    val tagsText: String get() = tags.take(8).joinToString(" ") { "#$it" }
}
