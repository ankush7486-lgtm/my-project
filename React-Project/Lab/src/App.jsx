import React, { useState } from "react";
import "./App.css";

function App() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Mahivardhan", designation: "Developer" },
    { id: 2, name: "Tanisq", designation: "Designer" },
    { id: 3, name: "Rahul", designation: "Manager" },
  ]);

  const handleDelete = (id) => {
    setEmployees(employees.filter((emp) => emp.id !== id));
  };

  return (
    <div className="container">
      <h1>Employee List</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Designation</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.id}</td>
              <td>{emp.name}</td>
              <td>{emp.designation}</td>
              <td>
                <button onClick={() => handleDelete(emp.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan="4">No employees available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
