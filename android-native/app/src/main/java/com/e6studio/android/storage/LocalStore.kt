package com.e6studio.android.storage

import android.content.Context

class LocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("e6studio", Context.MODE_PRIVATE)

    fun favorites(): MutableSet<Long> = prefs.getStringSet("favorites", emptySet())
        ?.mapNotNull { it.toLongOrNull() }
        ?.toMutableSet() ?: mutableSetOf()

    fun history(): MutableList<Long> = prefs.getString("history", "")
        .orEmpty()
        .split(",")
        .mapNotNull { it.toLongOrNull() }
        .toMutableList()

    fun toggleFavorite(id: Long): Boolean {
        val fav = favorites()
        val added = if (fav.contains(id)) {
            fav.remove(id)
            false
        } else {
            fav.add(id)
            true
        }
        prefs.edit().putStringSet("favorites", fav.map { it.toString() }.toSet()).apply()
        return added
    }

    fun addHistory(id: Long) {
        val history = history()
        history.remove(id)
        history.add(0, id)
        while (history.size > 300) history.removeLast()
        prefs.edit().putString("history", history.joinToString(",")).apply()
    }

    fun isIncognito(): Boolean = prefs.getBoolean("incognito", false)
    fun setIncognito(value: Boolean) = prefs.edit().putBoolean("incognito", value).apply()

    fun theme(): String = prefs.getString("theme", "dark") ?: "dark"
    fun setTheme(value: String) = prefs.edit().putString("theme", value).apply()

    fun maxRating(): String = prefs.getString("max_rating", "e") ?: "e"
    fun setMaxRating(value: String) = prefs.edit().putString("max_rating", value).apply()

    fun blacklistTags(): MutableSet<String> = prefs.getStringSet("blacklist_tags", emptySet())
        ?.map { it.trim() }
        ?.filter { it.isNotBlank() }
        ?.toMutableSet() ?: mutableSetOf()

    fun setBlacklistTags(tags: Set<String>) {
        prefs.edit().putStringSet("blacklist_tags", tags.map { it.trim() }.filter { it.isNotBlank() }.toSet()).apply()
    }
}
