package com.e6studio.mobile

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class DataRepository {
    private val api: ApiService

    init {
        val logger = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC }
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("User-Agent", "E6StudioMobile/1.0 (Android GeckoView)")
                    .build()
                chain.proceed(request)
            }
            .addInterceptor(logger)
            .build()

        api = Retrofit.Builder()
            .baseUrl("https://e621.net/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    suspend fun loadPosts(tags: String, page: Int): List<UiPost> {
        return api.getPosts(tags = tags, limit = 40, page = page).posts.mapNotNull { post ->
            val fullUrl = post.file.url ?: return@mapNotNull null
            UiPost(
                id = post.id,
                previewUrl = post.preview?.url ?: fullUrl,
                fullUrl = fullUrl,
                title = "E621 #${post.id}",
                rating = post.rating,
                tags = post.tags.general,
                likes = post.score.up,
                favorites = post.favorites
            )
        }
    }
}
