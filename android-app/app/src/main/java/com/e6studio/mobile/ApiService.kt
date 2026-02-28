package com.e6studio.mobile

import retrofit2.http.GET
import retrofit2.http.Query

interface ApiService {
    @GET("posts.json")
    suspend fun getPosts(
        @Query("tags") tags: String,
        @Query("limit") limit: Int,
        @Query("page") page: Int
    ): E621Response
}
