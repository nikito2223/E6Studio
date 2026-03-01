package com.e6studio.android.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.e6studio.android.R
import com.e6studio.android.databinding.ItemPostBinding
import com.e6studio.android.model.PostItem

class PostAdapter(
    private val onClick: (PostItem) -> Unit
) : RecyclerView.Adapter<PostAdapter.PostVH>() {

    private val items = mutableListOf<PostItem>()

    fun submitData(newItems: List<PostItem>) {
        items.clear()
        items.addAll(newItems)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PostVH {
        val binding = ItemPostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return PostVH(binding, onClick)
    }

    override fun getItemCount(): Int = items.size

    override fun onBindViewHolder(holder: PostVH, position: Int) {
        holder.bind(items[position])
    }

    class PostVH(
        private val binding: ItemPostBinding,
        private val onClick: (PostItem) -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(item: PostItem) {
            binding.title.text = "#${item.id} • ${item.rating.uppercase()} • ❤ ${item.score}"
            binding.tags.text = item.tags.ifBlank { binding.root.context.getString(R.string.no_tags) }
            binding.preview.load(item.previewUrl) {
                crossfade(true)
                placeholder(R.drawable.placeholder_bg)
                error(R.drawable.placeholder_bg)
            }
            binding.root.setOnClickListener { onClick(item) }
        }
    }
}
