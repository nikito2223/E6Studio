package com.e6studio.android.ui

import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import androidx.appcompat.app.AppCompatActivity
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
        val ratings = listOf("s", "q", "e")

        binding.themeSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, themes)
        binding.maxRatingSpinner.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, ratings)

        binding.themeSpinner.setSelection(themes.indexOf(localStore.theme()).coerceAtLeast(0))
        binding.maxRatingSpinner.setSelection(ratings.indexOf(localStore.maxRating()).coerceAtLeast(0))
        binding.incognitoSwitch.isChecked = localStore.isIncognito()
        binding.blacklistInput.setText(localStore.blacklistTags().joinToString(", "))
        binding.passwordInput.setText(localStore.appPassword())

        binding.pluginsBtn.setOnClickListener {
            startActivity(Intent(this, PluginsActivity::class.java))
        }

        binding.saveBtn.setOnClickListener {
            localStore.setTheme(themes[binding.themeSpinner.selectedItemPosition])
            localStore.setMaxRating(ratings[binding.maxRatingSpinner.selectedItemPosition])
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

        binding.cancelBtn.setOnClickListener { finish() }
    }
}
