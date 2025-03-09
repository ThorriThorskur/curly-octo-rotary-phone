document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch('/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categories = await response.json();
      const categoriesList = document.getElementById('categories');
      categories.forEach(category => {
        const li = document.createElement('li');
        li.dataset.slug = category.slug;
        const anchor = document.createElement('a');
        anchor.href = `/questions.html?slug=${encodeURIComponent(category.slug)}`;
        anchor.textContent = category.name;
        li.appendChild(anchor);
  
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Breyta flokki';
        editBtn.addEventListener('click', () => {
          window.location.href = `/editCategory.html?slug=${encodeURIComponent(category.slug)}`;
        });
        li.appendChild(editBtn);

        // Delete Category button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eyða flokki';
        deleteBtn.addEventListener('click', async () => {
          if (confirm('Are you sure?')) {
            try {
              const res = await fetch(`/categories/${category.slug}`, { method: 'DELETE' });
              if (res.status === 204) {
                alert('Successfully deleted category');
                li.remove();
              } else {
                const errData = await res.json();
                alert(' Error: ' + (errData.error || 'Unknown error'));
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              alert('Error deleting category');
            }
          }
        });
        li.appendChild(deleteBtn);
        categoriesList.appendChild(li);
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    document.getElementById('createQuestionBtn').addEventListener('click', () => {
      window.location.href = '/createQuestion.html';
    });
  });