package com.e6studio.android.ui

import android.content.Intent
import android.os.Bundle
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
        val filtered = when (filter) {
            "Все" -> allPosts
            "Safe" -> allPosts.filter { it.rating == "s" }
            "Questionable" -> allPosts.filter { it.rating == "q" }
            "Explicit" -> allPosts.filter { it.rating == "e" }
            else -> allPosts
        }
        adapter.submitList(filtered)
    }

    private val collectionsAdapter = StringListAdapter { collection ->
        when (collection) {
            "Избранное" -> {
                val fav = localStore.favorites()
                adapter.submitList(allPosts.filter { fav.contains(it.id) })
            }
            "История" -> {
                val history = localStore.history().toSet()
                adapter.submitList(allPosts.filter { history.contains(it.id) })
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        localStore = LocalStore(this)

        setupUi()
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
        binding.settingsBtn.setOnClickListener { binding.drawerLayout.openDrawer(GravityCompat.START) }

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
            "favorites", "history" -> { /* local filtering */ }
        }

        currentPage = 1
        if (tab == "favorites") {
            val fav = localStore.favorites()
            adapter.submitList(allPosts.filter { fav.contains(it.id) })
        } else if (tab == "history") {
            val history = localStore.history().toSet()
            adapter.submitList(allPosts.filter { history.contains(it.id) })
        } else {
            loadPosts()
        }
    }

    private fun loadPosts() {
        binding.progress.isVisible = true
        binding.pageLabel.text = currentPage.toString()

        val tags = if (selectedTab == "popular" || selectedTab == "new") currentTags else currentTags
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

        val uniqueTags = posts.asSequence()
            .flatMap { it.tags.asSequence() }
            .distinct()
            .take(200)
            .toList()
        tagsAdapter.submit(uniqueTags)

        adapter.setFavorites(localStore.favorites())

        val out = when (selectedTab) {
            "favorites" -> {
                val fav = localStore.favorites()
                posts.filter { fav.contains(it.id) }
            }
            "history" -> {
                val h = localStore.history().toSet()
                posts.filter { h.contains(it.id) }
            }
            else -> posts
        }

        binding.emptyView.isVisible = out.isEmpty()
        adapter.submitList(out)
    }

    private fun updateIncognitoUi(enabled: Boolean) {
        binding.incognitoBtn.alpha = if (enabled) 1f else 0.5f
    }

    override fun onDestroy() {
        super.onDestroy()
        networkExecutor.shutdownNow()
    }
}
