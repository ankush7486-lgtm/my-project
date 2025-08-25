var categorySelect = document.getElementById("category");
var productList = document.getElementById("product-list");
var products = productList.getElementsByTagName("li");

categorySelect.addEventListener("change", function() {
  var selectedCategory = categorySelect.value;

  for (var i = 0; i < products.length; i++) {
    var productCategory = products[i].getAttribute("data-category");

    if (selectedCategory === "All" || selectedCategory === productCategory) {
      products[i].style.display = "block";
    } else {
      products[i].style.display = "none";
    }
  }
});