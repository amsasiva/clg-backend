const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render-hosted PostgreSQL
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// API Route: Fetch All Schemes
app.get("/schemes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Schemes");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching schemes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.get("/dynamicschemes", async (req, res) => {
//   const { benefits, age, income, state } = req.query;
//   let query = "SELECT * FROM Schemes WHERE 1=1";
//   let params = [];

//   if (benefits) {
//     query += " AND LOWER(benefits) = $1";
//     params.push(benefits.toLowerCase());
//   }
//   // Add other filters similarly...

//   try {
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error fetching schemes:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// app.get("/dynamicschemes", async (req, res) => {
//   const { age, gender, caste, occupation, residence,application_mode,scheme_category } = req.query;

//   let query = "SELECT * FROM Schemes WHERE 1=1";
//   const params = [];
//   let i = 1;

//   if (age) {
//     query += ` AND $${i}::int BETWEEN
//                   CAST(SPLIT_PART(age, '-', 1) AS INT) AND
//                   CAST(SPLIT_PART(age, '-', 2) AS INT)`;
//     params.push(age);
//     i++;
//   }

//   if (gender) {
//     query += ` AND gender = $${i}`;
//     params.push(gender);
//     i++;
//   }

//   if (caste) {
//     query += ` AND caste = $${i}`;
//     params.push(caste);
//     i++;
//   }

//   if (occupation) {
//     query += ` AND occupation = $${i}`;
//     params.push(occupation);
//     i++;
//   }

//   if (residence) {
//     query += ` AND residence = $${i}`;
//     params.push(residence);
//     i++;
//   }
//   if (application_mode) {
//     query += ` AND $${i} = ANY(application_mode)`;
//     params.push(application_mode);
//     i++;
//   }

//   if (scheme_category) {
//     query += ` AND $${i} = ANY(scheme_category)`;
//     params.push(scheme_category);
//     i++;
//   }
//   try {
//     const result = await pool.query(query, params);
//     res.json(result.rows);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/dynamicschemes", async (req, res) => {
  // Extract filter parameters
  const {
    age,
    gender,
    caste,
    occupation,
    residence,
    application_mode,
    scheme_category,
    differently_abled,
    benefit_type,
    government_employee,
    marital_status,
    level,
    minority,
    employment_status,
    page = 1,
    limit = 10,
  } = req.query;

  // Convert page and limit to integers
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Validate pagination parameters
  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    return res.status(400).json({
      error:
        "Invalid pagination parameters. Page and limit must be positive integers.",
    });
  }

  // Calculate offset
  const offset = (pageNum - 1) * limitNum;

  // Build the base query
  let countQuery = "SELECT COUNT(*) FROM Schemes WHERE 1=1";
  let dataQuery = "SELECT * FROM Schemes WHERE 1=1";
  let params = [];
  let i = 1;

  // Add filter conditions
  // ✅ AGE RANGE HANDLING: like "18-30"
  if (age) {
    const match = age.match(/^(\d+)-(\d+)$/);
    if (match) {
      const reqMin = parseInt(match[1]);
      const reqMax = parseInt(match[2]);

      // Overlap condition: db_min <= reqMax AND reqMin <= db_max
      const ageCondition = `
      AND (
        CAST(SPLIT_PART(age, '-', 1) AS INT) <= $${i} 
        AND 
        CAST(SPLIT_PART(age, '-', 2) AS INT) >= $${i + 1}
      )
    `;
      countQuery += ageCondition;
      dataQuery += ageCondition;
      params.push(reqMax, reqMin);
      i += 2;
    } else {
      console.warn(`Invalid age range format: ${age}`);
    }
  }
  if (gender) {
    // Check if the value is "all" to return all genders
    if (gender.toLowerCase() === "all") {
      // No filter needed for "all" - it will return all genders
    } else {
      // Make case-insensitive comparison and include "all" values
      const condition = ` AND (LOWER(gender) = LOWER($${i}) OR LOWER(gender) = 'all')`;
      countQuery += condition;
      dataQuery += condition;
      params.push(gender);
      i++;
    }
  }

  if (caste) {
    // Check if the value is "all" to return all castes
    if (caste.toLowerCase() === "all") {
      // No filter needed for "all" - it will return all castes
    } else {
      // Make case-insensitive comparison and include "all" values
      const condition = ` AND (LOWER(caste) = LOWER($${i}) OR LOWER(caste) = 'all')`;
      countQuery += condition;
      dataQuery += condition;
      params.push(caste);
      i++;
    }
  }

  if (occupation) {
    // Check if the value is "all" to return all occupations
    if (occupation.toLowerCase() === "all") {
      // No filter needed for "all" - it will return all occupations
    } else {
      // Make case-insensitive comparison and include "all" values
      const condition = ` AND (LOWER(occupation) = LOWER($${i}) OR LOWER(occupation) = 'all')`;
      countQuery += condition;
      dataQuery += condition;
      params.push(occupation);
      i++;
    }
  }

  if (residence) {
    // Check if the value is "all" to return all residences
    if (residence.toLowerCase() === "all") {
      // No filter needed for "all" - it will return all residences
    } else {
      // Make case-insensitive comparison and include "all" values
      const condition = ` AND (LOWER(residence) = LOWER($${i}) OR LOWER(residence) = 'all')`;
      countQuery += condition;
      dataQuery += condition;
      params.push(residence);
      i++;
    }
  }

  if (application_mode) {
    // Check if the value is "all" or similar to return both offline and online schemes
    if (
      application_mode.toLowerCase() === "all" ||
      application_mode.toLowerCase() === "common"
    ) {
      // No filter needed for "all" - it will return both offline and online schemes
    } else {
      try {
        const condition = ` AND $${i} = ANY(application_mode)`;
        countQuery += condition;
        dataQuery += condition;
        params.push(application_mode);
        i++;
      } catch (error) {
        console.warn(
          `Error processing application_mode filter: ${error.message}`
        );
      }
    }
  }

  // Add differently_abled filter
  if (differently_abled) {
    // Check if the value is "all" to return all options
    if (differently_abled.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(differently_abled) = LOWER($${i}) OR LOWER(differently_abled) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(differently_abled);
        i++;
      } catch (error) {
        console.warn(
          `Error processing differently_abled filter: ${error.message}`
        );
      }
    }
  }

  // Add benefit_type filter
  if (benefit_type) {
    // Check if the value is "all" to return all options
    if (benefit_type.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(benefit_type) = LOWER($${i}) OR LOWER(benefit_type) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(benefit_type);
        i++;
      } catch (error) {
        console.warn(`Error processing benefit_type filter: ${error.message}`);
      }
    }
  }

  // Add government_employee filter
  if (government_employee) {
    // Check if the value is "all" to return all options
    if (government_employee.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(government_employee) = LOWER($${i}) OR LOWER(government_employee) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(government_employee);
        i++;
      } catch (error) {
        console.warn(
          `Error processing government_employee filter: ${error.message}`
        );
      }
    }
  }

  // Add marital_status filter
  if (marital_status) {
    // Check if the value is "all" to return all options
    if (marital_status.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(marital_status) = LOWER($${i}) OR LOWER(marital_status) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(marital_status);
        i++;
      } catch (error) {
        console.warn(
          `Error processing marital_status filter: ${error.message}`
        );
      }
    }
  }

  // Add level filter
  if (level) {
    // Check if the value is "all" to return all options
    if (level.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(level) = LOWER($${i}) OR LOWER(level) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(level);
        i++;
      } catch (error) {
        console.warn(`Error processing level filter: ${error.message}`);
      }
    }
  }

  // Add minority filter
  if (minority) {
    // Check if the value is "all" to return all options
    if (minority.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(minority) = LOWER($${i}) OR LOWER(minority) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(minority);
        i++;
      } catch (error) {
        console.warn(`Error processing minority filter: ${error.message}`);
      }
    }
  }

  // Add employment_status filter
  if (employment_status) {
    // Check if the value is "all" to return all options
    if (employment_status.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // Make case-insensitive comparison and include "all" values
        const condition = ` AND (LOWER(employment_status) = LOWER($${i}) OR LOWER(employment_status) = 'all')`;
        countQuery += condition;
        dataQuery += condition;
        params.push(employment_status);
        i++;
      } catch (error) {
        console.warn(
          `Error processing employment_status filter: ${error.message}`
        );
      }
    }
  }

  if (scheme_category) {
    // Check if the value is "all" to return all scheme categories
    if (scheme_category.toLowerCase() === "all") {
      // No filter needed for "all"
    } else {
      try {
        // const condition = ` AND $${i} = ANY(scheme_category)`; // ✅ Corrected
        // countQuery += condition;
        // dataQuery += condition;
        // params.push(scheme_category.toLowerCase());
        // i++;
        const categoriesArray = decodeURIComponent(scheme_category)
          .split(",")
          .map((cat) => cat.trim());

        const condition = ` AND scheme_category && $${i}::text[]`;
        countQuery += condition;
        dataQuery += condition;
        params.push(categoriesArray);
        i++;
      } catch (error) {
        console.warn(
          `Error processing scheme_category filter: ${error.message}`
        );
      }
    }
  }

  // Add pagination to data query only
  dataQuery += ` ORDER BY scheme_id LIMIT $${i} OFFSET $${i + 1}`;
  const dataParams = [...params, limitNum, offset];
  console.log("dataQuery", dataQuery);
  console.log("dataParams", dataParams);
  try {
    // Execute count query first to get total items
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Execute data query with pagination
    const dataResult = await pool.query(dataQuery, dataParams);

    // Return paginated response
    res.json({
      currentPage: pageNum,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: limitNum,
      schemes: dataResult.rows,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Signup API (by Username)
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if username already exists
    const userCheck = await pool.query(
      "SELECT * FROM Users WHERE username = $1",
      [username]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Insert into DB
    await pool.query(
      "INSERT INTO Users (username, email, password) VALUES ($1, $2, $3)",
      [username, email || null, password]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Signin API (using Username)
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM Users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
