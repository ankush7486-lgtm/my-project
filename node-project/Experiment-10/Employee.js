const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let employees = [
  { name: "Nutan", id: "E101" },
  { name: "Rishit", id: "E102" },
  { name: "Yash", id: "E103" },
  {name:"Ayush", id: "E104"}
];

function menu() {
  console.log("\nEmployee Management System");
  console.log("1. Add Employee");
  console.log("2. List Employees");
  console.log("3. Remove Employee");
  console.log("4. Exit");

  rl.question("Enter your choice: ", (choice) => {
    if (choice === "1") addEmployee();
    else if (choice === "2") listEmployees();
    else if (choice === "3") removeEmployee();
    else if (choice === "4") rl.close();
    else {
      console.log("Invalid choice!");
      menu();
    }
  });
}

function addEmployee() {
  rl.question("Enter employee name: ", (name) => {
    rl.question("Enter employee ID: ", (id) => {
      employees.push({ name, id });
      console.log(`Employee ${name} (ID: ${id}) added successfully.`);
      menu();
    });
  });
}

function listEmployees() {
  console.log("\nEmployee List:");
  employees.forEach((emp, i) => {
    console.log(`${i + 1}. Name: ${emp.name}, ID: ${emp.id}`);
  });
  menu();
}

function removeEmployee() {
  rl.question("Enter employee ID to remove: ", (id) => {
    employees = employees.filter(emp => emp.id !== id);
    console.log(`Employee with ID ${id} removed (if existed).`);
    menu();
  });
}

menu();
