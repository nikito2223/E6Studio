package com.e6studio.android.ui

import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import com.e6studio.android.databinding.ActivitySettingsBinding
import com.e6studio.android.storage.LocalStore
import com.e6studio.android.util.ThemePalette

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var localStore: LocalStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        localStore = LocalStore(this)

        val themes = listOf("dark", "light", "blue", "red")
        val ratings = listOf(
            "s — только safe",
            "q — safe + questionable",
            "e — всё"
        )

        binding.themeSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, themes)
        binding.maxRatingSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, ratings)

        binding.themeSpinner.setSelection(themes.indexOf(localStore.theme()).coerceAtLeast(0))
        binding.maxRatingSpinner.setSelection(
            when (localStore.maxRating()) {
                "s" -> 0
                "q" -> 1
                else -> 2
            }
        )
        binding.incognitoSwitch.isChecked = localStore.isIncognito()
        binding.blacklistInput.setText(localStore.blacklistTags().joinToString(", "))
        binding.passwordInput.setText(localStore.appPassword())
        binding.appInfoText.text = buildAboutText()
        applyThemeUi(localStore.theme())

        binding.aboutSectionBtn.setOnClickListener { showSection(isAbout = true) }
        binding.securitySectionBtn.setOnClickListener { showSection(isAbout = false) }
        binding.closeBtn.setOnClickListener { finish() }

        binding.saveBtn.setOnClickListener {
            val selectedTheme = themes[binding.themeSpinner.selectedItemPosition]
            localStore.setTheme(selectedTheme)
            localStore.setMaxRating(
                when (binding.maxRatingSpinner.selectedItemPosition) {
                    0 -> "s"
                    1 -> "q"
                    else -> "e"
                }
            )
            localStore.setIncognito(binding.incognitoSwitch.isChecked)

            val tags = binding.blacklistInput.text?.toString().orEmpty()
                .split(",", "\n", " ")
                .map { it.trim() }
                .filter { it.isNotBlank() }
                .toSet()
            localStore.setBlacklistTags(tags)
            localStore.setAppPassword(binding.passwordInput.text?.toString().orEmpty())

            applyThemeUi(selectedTheme)
            setResult(RESULT_OK)
            finish()
        }

        showSection(isAbout = true)
    }

    private fun showSection(isAbout: Boolean) {
        binding.aboutSection.isVisible = isAbout
        binding.securitySection.isVisible = !isAbout
        binding.aboutSectionBtn.alpha = if (isAbout) 1f else 0.65f
        binding.securitySectionBtn.alpha = if (isAbout) 0.65f else 1f
    }

    private fun applyThemeUi(theme: String) {
        val palette = ThemePalette.from(theme)
        binding.root.setBackgroundColor(palette.mainBg)
        binding.aboutSection.background?.setTint(palette.surface)
        binding.securitySection.background?.setTint(palette.surface)

        tintButton(binding.closeBtn, palette)
        tintButton(binding.aboutSectionBtn, palette)
        tintButton(binding.securitySectionBtn, palette)
        tintButton(binding.saveBtn, palette)

        tintTree(binding.root, palette)
        tintInput(binding.blacklistInput, palette)
        tintInput(binding.passwordInput, palette)
        tintSpinner(binding.themeSpinner, palette)
        tintSpinner(binding.maxRatingSpinner, palette)
        binding.incognitoSwitch.thumbTintList = android.content.res.ColorStateList.valueOf(palette.accent)
        binding.incognitoSwitch.trackTintList = android.content.res.ColorStateList.valueOf(palette.surfaceAlt)
    }

    private fun tintTree(view: View, palette: ThemePalette) {
        if (view is ViewGroup && view.background != null) {
            view.background?.setTint(palette.surface)
        }
        when (view) {
            is TextView -> if (view !is Button && view !is EditText) view.setTextColor(palette.textPrimary)
            is EditText -> tintInput(view, palette)
            is Button -> tintButton(view, palette)
            is Switch -> view.setTextColor(palette.textPrimary)
        }
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) tintTree(view.getChildAt(i), palette)
        }
    }

    private fun tintButton(button: Button, palette: ThemePalette) {
        button.setBackgroundColor(palette.accent)
        button.setTextColor(palette.accentText)
    }

    private fun tintInput(editText: EditText, palette: ThemePalette) {
        editText.background?.setTint(palette.surfaceAlt)
        editText.setTextColor(palette.textPrimary)
        editText.setHintTextColor(palette.textSecondary)
    }

    private fun tintSpinner(spinner: Spinner, palette: ThemePalette) {
        spinner.background?.setTint(palette.surfaceAlt)
    }

    private fun buildAboutText(): String {
        val packageInfo = packageManager.getPackageInfo(packageName, 0)
        val versionName = packageInfo.versionName ?: "1.0"
        return buildString {
            appendLine("Название: E6Studio")
            appendLine("Версия: $versionName")
            appendLine("Разработчик: Rufik")
            appendLine("Лицензия: MIT")
            appendLine("API: e621 REST API")
            append("Назначение: нативный Android-клиент для просмотра и поиска постов e621.")
        }
    }
}
