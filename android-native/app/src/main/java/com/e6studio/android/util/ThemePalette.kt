package com.e6studio.android.util

import android.graphics.Color

data class ThemePalette(
    val mainBg: Int,
    val surface: Int,
    val surfaceAlt: Int,
    val textPrimary: Int,
    val textSecondary: Int,
    val accent: Int,
    val accentText: Int
) {
    companion object {
        fun from(theme: String): ThemePalette = when (theme) {
            "light" -> ThemePalette(
                mainBg = Color.parseColor("#F6F8FB"),
                surface = Color.parseColor("#FFFFFF"),
                surfaceAlt = Color.parseColor("#E8EEF5"),
                textPrimary = Color.parseColor("#0B1B26"),
                textSecondary = Color.parseColor("#4D6477"),
                accent = Color.parseColor("#6C5CE7"),
                accentText = Color.WHITE
            )
            "blue" -> ThemePalette(
                mainBg = Color.parseColor("#071833"),
                surface = Color.parseColor("#0C2A47"),
                surfaceAlt = Color.parseColor("#12385D"),
                textPrimary = Color.parseColor("#EAF6FF"),
                textSecondary = Color.parseColor("#BCDFF6"),
                accent = Color.parseColor("#5AA7FF"),
                accentText = Color.parseColor("#071833")
            )
            "red" -> ThemePalette(
                mainBg = Color.parseColor("#090607"),
                surface = Color.parseColor("#15080A"),
                surfaceAlt = Color.parseColor("#2F1118"),
                textPrimary = Color.parseColor("#FFF5F4"),
                textSecondary = Color.parseColor("#F0D8D7"),
                accent = Color.parseColor("#E85A4F"),
                accentText = Color.WHITE
            )
            else -> ThemePalette(
                mainBg = Color.parseColor("#07111A"),
                surface = Color.parseColor("#0D1B26"),
                surfaceAlt = Color.parseColor("#123146"),
                textPrimary = Color.parseColor("#E8F1F7"),
                textSecondary = Color.parseColor("#B9C8D3"),
                accent = Color.parseColor("#2EC4B6"),
                accentText = Color.parseColor("#07111A")
            )
        }
    }
}
