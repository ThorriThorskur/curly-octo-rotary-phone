document.addEventListener('DOMContentLoaded', async () => {
    // Get the category slug from the URL (e.g., ?slug=example-category)
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('slug');
    
    const nameInput = document.getElementById('name');
  
    async function loadCategory() {
      if (!categorySlug) return;
      try {
        const res = await fetch(`/categories/${categorySlug}`);
        if (res.ok) {
          const category = await res.json();
          nameInput.value = category.name;
        } else {
          alert('Failed to load category data.');
        }
      } catch (error) {
        console.error('Error loading category:', error);
      }
    }
    
    await loadCategory();
  
    document.getElementById('editCategoryForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const data = { name };
      try {
        const res = await fetch(`/categories/${categorySlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert('Category updated successfully!');
          window.history.back();
        } else {
          const errData = await res.json();
          alert('Error updating category: ' + (errData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating category:', error);
        alert('An unexpected error occurred.');
      }
    });
  });