function updateCount(textareaId, countId) {
    var text = document.getElementById(textareaId).value;
    document.getElementById(countId).innerText = text.length;
  }
  
  document.getElementById("text1").addEventListener("input", function() {
    updateCount("text1", "count1");
  });