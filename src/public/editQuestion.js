document.addEventListener('DOMContentLoaded', async () => {
    // Get the question id from the URL query (e.g., ?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');
  
    const titleInput = document.getElementById('title');
    const categorySelect = document.getElementById('categorySelect');
    const answersContainer = document.getElementById('answersContainer');
    const addAnswerBtn = document.getElementById('addAnswerBtn');
  
    // Load categories into the dropdown
    async function loadCategories() {
      try {
        const res = await fetch('/categories');
        if (res.ok) {
          const categories = await res.json();
          categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
          });
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
  
    // Load existing question data including its answers
    async function loadQuestion() {
      if (!questionId) return;
      try {
        const res = await fetch(`/questions/${questionId}`);
        if (res.ok) {
          const question = await res.json();
          titleInput.value = question.title;
          categorySelect.value = question.categoryId;
          answersContainer.innerHTML = '';
          question.answers.forEach(ans => {
            addAnswerField(ans.answer, ans.correct);
          });
        } else {
          alert('Failed to load question data.');
        }
      } catch (error) {
        console.error('Error loading question:', error);
      }
    }
  
    // Function to add an answer field
    function addAnswerField(answerText = '', isCorrect = false) {
      const div = document.createElement('div');
      
      const answerInput = document.createElement('input');
      answerInput.type = 'text';
      answerInput.value = answerText;
      answerInput.required = true;
      
      const correctCheckbox = document.createElement('input');
      correctCheckbox.type = 'checkbox';
      correctCheckbox.checked = isCorrect;
      correctCheckbox.addEventListener('change', function() {
        if (this.checked) {
          // Ensure only one checkbox is selected
          const checkboxes = answersContainer.querySelectorAll('input[type="checkbox"]');
          checkboxes.forEach(cb => {
            if (cb !== this) cb.checked = false;
          });
        }
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        answersContainer.removeChild(div);
      });
      
      div.appendChild(answerInput);
      div.appendChild(document.createTextNode(' Correct: '));
      div.appendChild(correctCheckbox);
      div.appendChild(removeBtn);
      answersContainer.appendChild(div);
    }
  
    addAnswerBtn.addEventListener('click', () => {
      addAnswerField();
    });
  
    await loadCategories();
    await loadQuestion();
  
    // Handle form submission to update the question and its answers
    document.getElementById('editQuestionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = titleInput.value.trim();
      const categoryId = parseInt(categorySelect.value, 10);
      
      const answerDivs = answersContainer.querySelectorAll('div');
      const answers = [];
      answerDivs.forEach(div => {
        const textInput = div.querySelector('input[type="text"]');
        const checkbox = div.querySelector('input[type="checkbox"]');
        answers.push({
          answer: textInput.value.trim(),
          correct: checkbox.checked
        });
      });
      
      if (answers.length < 2) {
        alert('Please provide at least 2 answers.');
        return;
      }
      if (answers.length > 6) {
        alert('You can provide at most 6 answers.');
        return;
      }
      
      const data = { title, categoryId, answers };
      
      try {
        const res = await fetch(`/questions/${questionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert('Question updated successfully!');
          window.history.back();
        } else {
          const errData = await res.json();
          alert('Error updating question: ' + (errData.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error updating question:', error);
        alert('An unexpected error occurred.');
      }
    });
  }); 