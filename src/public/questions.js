document.addEventListener('DOMContentLoaded', () => {
  const questionsList = document.getElementById('questions');

  // Get the category slug from the URL (if provided)
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const fetchAndDisplayQuestions = (endpoint) => {
    fetch(endpoint)
      .then(response => response.json())
      .then(questions => {
        questionsList.innerHTML = '';
        questions.forEach(question => {
          const li = document.createElement('li');
          li.dataset.id = question.id;

          // Display question title
          const title = document.createElement('strong');
          title.textContent = question.title;
          li.appendChild(title);

          // Create a nested list for answers with radio buttons
          const answersList = document.createElement('ul');
          question.answers.forEach((answer, idx) => {
            const answerLi = document.createElement('li');
            // Create radio input
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question-${question.id}`;
            radio.value = idx;
            // Save the answer's correctness in a data attribute
            radio.dataset.correct = answer.correct.toString();

            // Create label for the answer
            const label = document.createElement('label');
            label.textContent = answer.answer;

            answerLi.appendChild(radio);
            answerLi.appendChild(label);

            // Add event listener to highlight the answer when selected
            radio.addEventListener('change', function() {
              if (this.checked) {
                if (this.dataset.correct === "true") {
                  answerLi.style.backgroundColor = "lightgreen";
                } else {
                  answerLi.style.backgroundColor = "salmon";
                }
                // Disable all radio buttons for this question so the answer cannot be changed
                const radios = document.getElementsByName(`question-${question.id}`);
                radios.forEach(r => r.disabled = true);
              }
            });

            answersList.appendChild(answerLi);
          });
          li.appendChild(answersList);

          // Create Edit Question button
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit Question';
          editBtn.addEventListener('click', () => {
            window.location.href = `/editQuestion.html?id=${question.id}`;
          });
          li.appendChild(editBtn);

          // Create Delete Question button
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Delete Question';
          deleteBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this question?')) {
              try {
                const res = await fetch(`/questions/${question.id}`, { method: 'DELETE' });
                if (res.status === 204) {
                  alert('Question deleted.');
                  li.remove();
                } else {
                  const errData = await res.json();
                  alert('Error deleting question: ' + (errData.error || 'Unknown error'));
                }
              } catch (error) {
                console.error('Error deleting question:', error);
                alert('An error occurred while deleting the question.');
              }
            }
          });
          li.appendChild(deleteBtn);

          questionsList.appendChild(li);
        });
      })
      .catch(error => console.error('Error fetching questions:', error));
  };

  if (slug) {
    fetchAndDisplayQuestions(`/categories/${slug}/questions`);
  } else {
    fetchAndDisplayQuestions('/questions');
  }
});