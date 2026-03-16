package com.e6studio.android.ui

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.GravityCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.e6studio.android.databinding.ActivityMainBinding
import com.e6studio.android.model.PostItem
import com.e6studio.android.network.E621Client
import com.e6studio.android.storage.LocalStore
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val networkExecutor = Executors.newSingleThreadExecutor()
    private val e621Client = E621Client()
    private lateinit var localStore: LocalStore

    private var currentPage = 1
    private var currentTags = "order:score"
    private var selectedTab = "popular"
    private var allPosts: List<PostItem> = emptyList()
    private var allTagsCache: List<String> = emptyList()
    private var selectedSidebarFilter = "Все"

    private val debounceHandler = Handler(Looper.getMainLooper())
    private var sidebarDebounceRunnable: Runnable? = null

    private val settingsLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        applyThemeUi(localStore.theme())
        updateIncognitoUi(localStore.isIncognito())
        refreshDerivedViews(allPosts)
    }

    private val adapter = PostAdapter(
        onClick = { item ->
            if (!localStore.isIncognito()) localStore.addHistory(item.id)
            startActivity(Intent(this, ViewerActivity::class.java).putExtra("post", item))
        },
        onFavoriteClick = { item ->
            localStore.toggleFavorite(item.id)
            refreshDerivedViews(allPosts)
        }
    )

    private val tagsAdapter = StringListAdapter { tag ->
        currentTags = tag
        currentPage = 1
        binding.drawerLayout.closeDrawer(GravityCompat.START)
        loadPosts()
    }

    private val filtersAdapter = StringListAdapter { filter ->
        selectedSidebarFilter = filter
        applyAllFiltersAndRender()
    }

    private val collectionsAdapter = StringListAdapter { collection ->
        selectedTab = when (collection) {
            "Избранное" -> "favorites"
            "История" -> "history"
            else -> selectedTab
        }
        applyAllFiltersAndRender()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        localStore = LocalStore(this)

        setupUi()
        applyThemeUi(localStore.theme())
        loadPosts()
    }

    override fun onResume() {
        super.onResume()
        adapter.setFavorites(localStore.favorites())
    }

    private fun setupUi() {
        binding.galleryRecycler.layoutManager = GridLayoutManager(this, 2)
        binding.galleryRecycler.adapter = adapter

        binding.tagList.layoutManager = LinearLayoutManager(this)
        binding.filterList.layoutManager = LinearLayoutManager(this)
        binding.collectionList.layoutManager = LinearLayoutManager(this)
        binding.tagList.adapter = tagsAdapter
        binding.filterList.adapter = filtersAdapter
        binding.collectionList.adapter = collectionsAdapter

        filtersAdapter.submit(listOf("Все", "Safe", "Questionable", "Explicit"))
        collectionsAdapter.submit(listOf("Избранное", "История"))

        binding.searchButton.setOnClickListener {
            currentTags = binding.searchInput.text?.toString()?.trim().orEmpty().ifBlank { currentTags }
            currentPage = 1
            loadPosts()
        }

        binding.sidebarSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = Unit
            override fun afterTextChanged(s: Editable?) {
                sidebarDebounceRunnable?.let(debounceHandler::removeCallbacks)
                sidebarDebounceRunnable = Runnable { filterTagList(s?.toString().orEmpty()) }
                debounceHandler.postDelayed(sidebarDebounceRunnable!!, 180)
            }
        })

        binding.menuPopular.setOnClickListener { selectTab("popular") }
        binding.menuNew.setOnClickListener { selectTab("new") }
        binding.menuFavorites.setOnClickListener { selectTab("favorites") }
        binding.menuHistory.setOnClickListener { selectTab("history") }

        binding.prevPageBtn.setOnClickListener {
            if (currentPage > 1) {
                currentPage -= 1
                loadPosts()
            }
        }
        binding.nextPageBtn.setOnClickListener {
            currentPage += 1
            loadPosts()
        }

        binding.openSidebarBtn.setOnClickListener { binding.drawerLayout.openDrawer(GravityCompat.START) }
        binding.settingsBtn.setOnClickListener {
            settingsLauncher.launch(Intent(this, SettingsActivity::class.java))
        }

        updateIncognitoUi(localStore.isIncognito())
        binding.incognitoBtn.setOnClickListener {
            val value = !localStore.isIncognito()
            localStore.setIncognito(value)
            updateIncognitoUi(value)
        }
    }

    private fun selectTab(tab: String) {
        selectedTab = tab
        binding.menuPopular.isChecked = tab == "popular"
        binding.menuNew.isChecked = tab == "new"
        binding.menuFavorites.isChecked = tab == "favorites"
        binding.menuHistory.isChecked = tab == "history"

        when (tab) {
            "popular" -> currentTags = "order:score"
            "new" -> currentTags = "order:id_desc"
            "favorites", "history" -> {
                applyAllFiltersAndRender()
                return
            }
        }

        currentPage = 1
        loadPosts()
    }

    private fun loadPosts() {
        binding.progress.isVisible = true
        binding.pageLabel.text = currentPage.toString()

        val tags = currentTags
        networkExecutor.execute {
            runCatching { e621Client.loadPosts(tags, currentPage) }
                .onSuccess { posts -> runOnUiThread { refreshDerivedViews(posts) } }
                .onFailure { err ->
                    runOnUiThread {
                        binding.progress.isVisible = false
                        binding.emptyView.isVisible = true
                        binding.emptyView.text = "Ошибка: ${err.message}"
                    }
                }
        }
    }

    private fun refreshDerivedViews(posts: List<PostItem>) {
        allPosts = posts
        binding.progress.isVisible = false

        allTagsCache = posts.asSequence()
            .flatMap { it.tags.asSequence() }
            .distinct()
            .sorted()
            .take(250)
            .toList()
        filterTagList(binding.sidebarSearch.text?.toString().orEmpty())

        adapter.setFavorites(localStore.favorites())
        applyAllFiltersAndRender()
    }

    private fun applyAllFiltersAndRender() {
        val maxRating = localStore.maxRating()
        val maxOrder = ratingOrder(maxRating)
        val blacklist = localStore.blacklistTags()

        var list = allPosts.filter { ratingOrder(it.rating) <= maxOrder }
        if (blacklist.isNotEmpty()) {
            list = list.filter { post -> post.tags.none { tag -> blacklist.contains(tag) } }
        }

        list = when (selectedSidebarFilter) {
            "Safe" -> list.filter { it.rating == "s" }
            "Questionable" -> list.filter { it.rating == "q" }
            "Explicit" -> list.filter { it.rating == "e" }
            else -> list
        }

        list = when (selectedTab) {
            "favorites" -> {
                val fav = localStore.favorites()
                list.filter { fav.contains(it.id) }
            }
            "history" -> {
                val h = localStore.history().toSet()
                list.filter { h.contains(it.id) }
            }
            else -> list
        }

        binding.emptyView.isVisible = list.isEmpty()
        adapter.submitList(list)
    }

    private fun filterTagList(query: String) {
        val q = query.trim().lowercase()
        val list = if (q.isBlank()) allTagsCache else allTagsCache.filter { it.lowercase().contains(q) }
        tagsAdapter.submit(list)
    }

    private fun ratingOrder(rating: String): Int = when (rating.lowercase()) {
        "s" -> 0
        "q" -> 1
        "e" -> 2
        else -> 2
    }

    private fun updateIncognitoUi(enabled: Boolean) {
        binding.incognitoBtn.alpha = if (enabled) 1f else 0.5f
    }

    private fun applyThemeUi(theme: String) {
        val palette = when (theme) {
            "light" -> Palette("#F6F8FB", "#FFFFFF", "#0B1B26", "#334E63", "#6C5CE7")
            "blue" -> Palette("#071833", "#0C2A47", "#EAF6FF", "#BCDFF6", "#5AA7FF")
            "red" -> Palette("#090607", "#15080A", "#FFF5F4", "#F0D8D7", "#E85A4F")
            else -> Palette("#07111A", "#0D1B26", "#E8F1F7", "#B9C8D3", "#2EC4B6")
        }

        val mainBg = Color.parseColor(palette.mainBg)
        val drawerBg = Color.parseColor(palette.drawerBg)
        val textPrimary = Color.parseColor(palette.textPrimary)
        val textSecondary = Color.parseColor(palette.textSecondary)
        val accent = Color.parseColor(palette.accent)

        binding.root.setBackgroundColor(mainBg)
        binding.mainRoot.setBackgroundColor(mainBg)
        binding.sidebarRoot.setBackgroundColor(drawerBg)

        binding.searchInput.setTextColor(textPrimary)
        binding.searchInput.setHintTextColor(textSecondary)
        binding.sidebarSearch.setTextColor(textPrimary)
        binding.sidebarSearch.setHintTextColor(textSecondary)

        binding.pageLabel.setTextColor(textPrimary)
        binding.emptyView.setTextColor(textPrimary)

        binding.searchButton.setBackgroundColor(accent)
        binding.prevPageBtn.setBackgroundColor(accent)
        binding.nextPageBtn.setBackgroundColor(accent)

        binding.menuPopular.setTextColor(textPrimary)
        binding.menuNew.setTextColor(textPrimary)
        binding.menuFavorites.setTextColor(textPrimary)
        binding.menuHistory.setTextColor(textPrimary)

        adapter.setTheme(theme)
        tagsAdapter.setTheme(theme)
        filtersAdapter.setTheme(theme)
        collectionsAdapter.setTheme(theme)
    }

    override fun onDestroy() {
        super.onDestroy()
        sidebarDebounceRunnable?.let(debounceHandler::removeCallbacks)
        networkExecutor.shutdownNow()
    }

    data class Palette(
        val mainBg: String,
        val drawerBg: String,
        val textPrimary: String,
        val textSecondary: String,
        val accent: String
    )
}
