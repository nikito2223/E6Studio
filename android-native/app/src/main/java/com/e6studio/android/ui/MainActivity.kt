package com.e6studio.android.ui

import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.widget.Toast
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
import com.e6studio.android.util.NetworkUtils
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val networkExecutor = Executors.newSingleThreadExecutor()
    private val e621Client = E621Client()
    private lateinit var localStore: LocalStore

    private var currentPage = 1
    private var currentTags = ""
    private var selectedTab = "home"
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
        binding.searchInput.setText(tag)
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
        updateConnectivityBanner()
        handleIntent(intent, initial = true)
        if (selectedTab == "home") {
            renderHomeState()
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent, initial = false)
    }

    override fun onResume() {
        super.onResume()
        adapter.setFavorites(localStore.favorites())
        updateConnectivityBanner()
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

        binding.searchButton.setOnClickListener { handleSearchAction() }
        binding.retryConnectionBtn.setOnClickListener {
            updateConnectivityBanner()
            if (selectedTab != "home") loadPosts() else renderHomeState()
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

        binding.quickPopularBtn.setOnClickListener { selectTab("popular") }
        binding.quickNewBtn.setOnClickListener { selectTab("new") }
        binding.quickFavoritesBtn.setOnClickListener { selectTab("favorites") }

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

    private fun handleIntent(intent: Intent?, initial: Boolean) {
        val sharedText = intent?.getStringExtra(Intent.EXTRA_TEXT).orEmpty()
        if (sharedText.startsWith("http://") || sharedText.startsWith("https://")) {
            openDeepLink(Uri.parse(sharedText.trim()))
            return
        }

        val data = intent?.data
        if (data != null && listOf("e621.net", "www.e621.net", "e926.net", "www.e926.net").contains(data.host)) {
            openDeepLink(data)
            return
        }

        if (!initial) return
        selectedTab = "home"
    }

    private fun openDeepLink(uri: Uri) {
        val idFromPath = uri.pathSegments.firstOrNull { it.toLongOrNull() != null }?.toLongOrNull()
        if (idFromPath != null) {
            openPostFromLink(idFromPath)
            return
        }

        val tags = uri.getQueryParameter("tags").orEmpty().trim()
        if (tags.isNotBlank()) {
            binding.searchInput.setText(tags)
            currentTags = tags
            currentPage = 1
            selectedTab = "popular"
            loadPosts()
            return
        }

        renderHomeState(message = "Ссылка открыта в E6Studio. Напишите теги или выберите быстрый режим.")
    }

    private fun openPostFromLink(postId: Long) {
        if (!NetworkUtils.isOnline(this)) {
            updateConnectivityBanner()
            Toast.makeText(this, "Нет интернета для открытия поста", Toast.LENGTH_LONG).show()
            return
        }
        binding.progress.isVisible = true
        binding.emptyView.isVisible = false
        networkExecutor.execute {
            runCatching { e621Client.loadPost(postId) }
                .onSuccess { post ->
                    runOnUiThread {
                        binding.progress.isVisible = false
                        startActivity(Intent(this, ViewerActivity::class.java).putExtra("post", post))
                    }
                }
                .onFailure { err ->
                    runOnUiThread {
                        binding.progress.isVisible = false
                        binding.emptyView.isVisible = true
                        binding.emptyView.text = "Не удалось открыть ссылку: ${err.message}"
                    }
                }
        }
    }

    private fun handleSearchAction() {
        val query = binding.searchInput.text?.toString()?.trim().orEmpty()
        if (query.startsWith("http://") || query.startsWith("https://")) {
            openDeepLink(Uri.parse(query))
            return
        }
        currentTags = query
        currentPage = 1
        loadPosts()
    }

    private fun selectTab(tab: String) {
        selectedTab = tab
        binding.menuPopular.isChecked = tab == "popular"
        binding.menuNew.isChecked = tab == "new"
        binding.menuFavorites.isChecked = tab == "favorites"
        binding.menuHistory.isChecked = tab == "history"

        when (tab) {
            "popular" -> {
                currentTags = binding.searchInput.text?.toString()?.trim().orEmpty().ifBlank { "order:score" }
                currentPage = 1
                loadPosts()
            }
            "new" -> {
                currentTags = binding.searchInput.text?.toString()?.trim().orEmpty().ifBlank { "order:id_desc" }
                currentPage = 1
                loadPosts()
            }
            "favorites", "history" -> {
                binding.heroCard.isVisible = false
                applyAllFiltersAndRender()
            }
            else -> renderHomeState()
        }
    }

    private fun renderHomeState(message: String = "Пока здесь пусто — напишите запрос в поиск, откройте ссылку e621 или выберите быстрый режим ниже.") {
        selectedTab = "home"
        allPosts = emptyList()
        adapter.submitList(emptyList())
        binding.progress.isVisible = false
        binding.heroCard.isVisible = true
        binding.heroSubtitle.text = message
        binding.emptyView.isVisible = true
        binding.emptyView.text = "Домашняя страница пуста. Напишите что-нибудь в поиск."
        binding.pageLabel.text = "—"
    }

    private fun updateConnectivityBanner() {
        val online = NetworkUtils.isOnline(this)
        binding.offlineBanner.isVisible = !online
    }

    private fun loadPosts() {
        if (selectedTab == "home") selectedTab = "popular"
        binding.heroCard.isVisible = false
        updateConnectivityBanner()
        if (!NetworkUtils.isOnline(this)) {
            binding.progress.isVisible = false
            binding.emptyView.isVisible = true
            binding.emptyView.text = "Нет интернета. Подключитесь к интернету и попробуйте снова."
            return
        }

        binding.progress.isVisible = true
        binding.emptyView.isVisible = false
        binding.pageLabel.text = currentPage.toString()

        val tags = currentTags.ifBlank {
            when (selectedTab) {
                "new" -> "order:id_desc"
                else -> "order:score"
            }
        }
        currentTags = tags
        binding.headerSubtitle.text = if (tags.startsWith("order:")) "Лента: $selectedTab" else "Запрос: $tags"

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
        binding.heroCard.isVisible = false
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
                val historyOrder = localStore.history()
                val historySet = historyOrder.toSet()
                list.filter { historySet.contains(it.id) }
                    .sortedBy { historyOrder.indexOf(it.id).takeIf { idx -> idx >= 0 } ?: Int.MAX_VALUE }
            }
            else -> list
        }

        binding.emptyView.isVisible = list.isEmpty()
        if (list.isEmpty()) {
            binding.emptyView.text = when (selectedTab) {
                "favorites" -> "В избранном пока пусто."
                "history" -> "История пока пустая."
                else -> "Ничего не найдено. Попробуйте другой запрос."
            }
        }
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

        binding.headerTitle.setTextColor(textPrimary)
        binding.headerSubtitle.setTextColor(textSecondary)
        binding.heroTitle.setTextColor(textPrimary)
        binding.heroSubtitle.setTextColor(textSecondary)
        binding.searchInput.setTextColor(textPrimary)
        binding.searchInput.setHintTextColor(textSecondary)
        binding.sidebarSearch.setTextColor(textPrimary)
        binding.sidebarSearch.setHintTextColor(textSecondary)

        binding.pageLabel.setTextColor(textPrimary)
        binding.emptyView.setTextColor(textPrimary)

        binding.searchButton.setBackgroundColor(accent)
        binding.prevPageBtn.setBackgroundColor(accent)
        binding.nextPageBtn.setBackgroundColor(accent)
        binding.retryConnectionBtn.setBackgroundColor(accent)
        binding.quickPopularBtn.setBackgroundColor(accent)
        binding.quickNewBtn.setBackgroundColor(accent)
        binding.quickFavoritesBtn.setBackgroundColor(accent)

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
