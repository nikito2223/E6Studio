package com.e6studio.android.model

data class PostItem(
    val id: Long,
    val previewUrl: String,
    val fileUrl: String,
    val rating: String,
    val score: Int,
    val tags: String
)
