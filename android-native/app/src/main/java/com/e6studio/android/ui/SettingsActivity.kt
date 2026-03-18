package com.e6studio.android.ui

import android.os.Bundle
import android.widget.ArrayAdapter
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import com.e6studio.android.databinding.ActivitySettingsBinding
import com.e6studio.android.storage.LocalStore

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

        binding.aboutSectionBtn.setOnClickListener { showSection(isAbout = true) }
        binding.securitySectionBtn.setOnClickListener { showSection(isAbout = false) }
        binding.closeBtn.setOnClickListener { finish() }

        binding.saveBtn.setOnClickListener {
            localStore.setTheme(themes[binding.themeSpinner.selectedItemPosition])
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
