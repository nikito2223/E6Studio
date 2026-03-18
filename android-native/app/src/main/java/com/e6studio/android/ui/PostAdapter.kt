package com.e6studio.android.ui

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.e6studio.android.R
import com.e6studio.android.databinding.ItemPostBinding
import com.e6studio.android.model.PostItem

class PostAdapter(
    private val onClick: (PostItem) -> Unit,
    private val onFavoriteClick: (PostItem) -> Unit
) : ListAdapter<PostItem, PostAdapter.PostVH>(Diff) {

    private var favoriteIds: Set<Long> = emptySet()
    private var theme: String = "dark"

    fun setFavorites(favorites: Set<Long>) {
        favoriteIds = favorites
        notifyDataSetChanged()
    }

    fun setTheme(value: String) {
        theme = value
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostVH {
        val binding = ItemPostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PostVH(binding, onClick, onFavoriteClick)
    }

    override fun onBindViewHolder(holder: PostVH, position: Int) {
        holder.bind(getItem(position), favoriteIds.contains(getItem(position).id), theme)
    }

    object Diff : DiffUtil.ItemCallback<PostItem>() {
        override fun areItemsTheSame(oldItem: PostItem, newItem: PostItem): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: PostItem, newItem: PostItem): Boolean = oldItem == newItem
    }

    class PostVH(
        private val binding: ItemPostBinding,
        private val onClick: (PostItem) -> Unit,
        private val onFavoriteClick: (PostItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: PostItem, isFavorite: Boolean, theme: String) {
            val textPrimary = if (theme == "light") Color.parseColor("#0B1B26") else Color.parseColor("#F5FBFF")
            val textSecondary = if (theme == "light") Color.parseColor("#334E63") else Color.parseColor("#B6CBDB")
            val accent = when (item.rating.lowercase()) {
                "s" -> "#42D392"
                "q" -> "#FFB74D"
                else -> "#FF6B7A"
            }

            binding.title.setTextColor(textPrimary)
            binding.tags.setTextColor(textSecondary)
            binding.typeBadge.setTextColor(textPrimary)
            binding.ratingBadge.setTextColor(textPrimary)
            binding.metaText.setTextColor(Color.parseColor(accent))

            val badge = when {
                item.isVideo -> "VIDEO"
                item.isGif -> "GIF"
                else -> "PHOTO"
            }
            val ratingLabel = when (item.rating.lowercase()) {
                "s" -> "SAFE"
                "q" -> "QUESTIONABLE"
                "e" -> "EXPLICIT"
                else -> item.rating.uppercase()
            }

            binding.typeBadge.text = badge
            binding.ratingBadge.text = ratingLabel
            binding.title.text = "Пост #${item.id}"
            binding.metaText.text = "❤ ${item.score} • ${item.displayResolution}"
            binding.tags.text = item.tagsText.ifBlank { binding.root.context.getString(R.string.no_tags) }
            binding.favoriteBtn.text = if (isFavorite) "★" else "☆"
            binding.preview.load(item.previewUrl.ifBlank { item.sampleUrl.ifBlank { item.fileUrl } }) {
                crossfade(true)
                placeholder(R.drawable.placeholder_bg)
                error(R.drawable.placeholder_bg)
            }
            binding.favoriteBtn.setOnClickListener { onFavoriteClick(item) }
            binding.root.setOnClickListener { onClick(item) }
        }
    }
}
