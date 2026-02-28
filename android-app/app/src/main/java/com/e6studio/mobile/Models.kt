package com.e6studio.mobile

import com.squareup.moshi.Json

data class E621Response(
    @Json(name = "posts") val posts: List<PostDto> = emptyList()
)

data class PostDto(
    val id: Long,
    val rating: String,
    val tags: TagsDto,
    val score: ScoreDto,
    @Json(name = "fav_count") val favorites: Int,
    val file: FileDto,
    val preview: PreviewDto?
)

data class TagsDto(
    val general: List<String> = emptyList()
)

data class ScoreDto(
    val up: Int = 0,
    val down: Int = 0
)

data class FileDto(
    val url: String?,
    val ext: String?
)

data class PreviewDto(
    val url: String?
)

data class UiPost(
    val id: Long,
    val previewUrl: String,
    val fullUrl: String,
    val title: String,
    val rating: String,
    val tags: List<String>,
    val likes: Int,
    val favorites: Int
)
