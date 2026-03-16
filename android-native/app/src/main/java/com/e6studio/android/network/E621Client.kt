package com.e6studio.android.network

import com.e6studio.android.model.PostItem
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class E621Client {
    private val client = OkHttpClient()

    fun loadPosts(tags: String, page: Int, limit: Int = 40): List<PostItem> {
        val encoded = URLEncoder.encode(tags, StandardCharsets.UTF_8.toString())
        val url = "https://e621.net/posts.json?tags=$encoded&limit=$limit&page=$page"

        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "E6StudioAndroid/1.1 (by rufik on e621)")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IllegalStateException("HTTP ${response.code}")

            val body = response.body?.string().orEmpty()
            val root = JSONObject(body)
            val postsArray = root.getJSONArray("posts")

            val result = ArrayList<PostItem>(postsArray.length())
            for (i in 0 until postsArray.length()) {
                val post = postsArray.getJSONObject(i)
                val file = post.getJSONObject("file")
                val preview = post.optJSONObject("preview")
                val tagsObj = post.optJSONObject("tags")
                val generalTags = tagsObj?.optJSONArray("general")

                val tags = mutableListOf<String>()
                if (generalTags != null) {
                    for (idx in 0 until generalTags.length()) {
                        tags += generalTags.getString(idx)
                    }
                }

                result += PostItem(
                    id = post.getLong("id"),
                    previewUrl = preview?.optString("url").orEmpty().ifBlank { file.optString("url") },
                    fileUrl = file.optString("url"),
                    fileExt = file.optString("ext", "jpg"),
                    rating = post.optString("rating", "u"),
                    score = post.optJSONObject("score")?.optInt("up") ?: 0,
                    tags = tags,
                    description = post.optString("description", "")
                )
            }
            return result
        }
    }
}
