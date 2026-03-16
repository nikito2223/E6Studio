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
            val textPrimary = if (theme == "light") Color.parseColor("#0B1B26") else Color.parseColor("#E8F1F7")
            val textSecondary = if (theme == "light") Color.parseColor("#334E63") else Color.parseColor("#B9C8D3")
            val cardBg = when (theme) {
                "light" -> Color.parseColor("#FFFFFF")
                "blue" -> Color.parseColor("#12385D")
                "red" -> Color.parseColor("#2F1118")
                else -> Color.parseColor("#0F1D2B")
            }

            binding.root.setBackgroundColor(cardBg)
            binding.title.setTextColor(textPrimary)
            binding.tags.setTextColor(textSecondary)

            val videoMark = if (item.isVideo) " 🎬" else ""
            binding.title.text = "#${item.id} • ${item.rating.uppercase()} • ❤ ${item.score}$videoMark"
            binding.tags.text = item.tagsText.ifBlank { binding.root.context.getString(R.string.no_tags) }
            binding.favoriteBtn.text = if (isFavorite) "★" else "☆"
            binding.preview.load(item.previewUrl) {
                crossfade(true)
                placeholder(R.drawable.placeholder_bg)
                error(R.drawable.placeholder_bg)
            }
            binding.favoriteBtn.setOnClickListener { onFavoriteClick(item) }
            binding.root.setOnClickListener { onClick(item) }
        }
    }
}
