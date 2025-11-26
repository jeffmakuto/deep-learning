# Semantic Integration System

A comprehensive semantic data integration solution that unifies data from multiple heterogeneous sources using OWL ontology and RDF, enabling seamless querying through SPARQL.

## 🎯 Project Overview

This project demonstrates semantic data integration by:
- Unifying three heterogeneous data sources (SQLite, XML, CSV)
- Designing a domain-specific OWL ontology (University Academic System)
- Creating semantic mappings to transform data into RDF format
- Implementing SPARQL queries for unified data access
- Validating semantic consistency and referential integrity

## 📁 Project Structure

```
semantic_integration/
├── data_sources/           # Heterogeneous data sources
│   ├── students.db         # SQLite database (10 students, 15 enrollments)
│   ├── courses.xml         # XML file (10 courses, 8 instructors)
│   ├── departments.csv     # CSV file (6 departments)
│   └── schemas.json        # Schema documentation
├── ontology/               # Domain ontology
│   └── university_ontology.owl  # OWL ontology (135 triples)
├── mappings/               # Mapping specifications
│   └── mapping_documentation.json
├── integration/            # Integration framework
│   └── semantic_integration.py  # Data transformation to RDF
├── queries/                # SPARQL queries
│   ├── sparql_queries.py   # Query & validation engine
│   ├── query_results.json  # Complete query results
│   └── query_*_results.json    # Individual query results
├── output/                 # RDF exports
│   ├── integrated_data.ttl     # Turtle format (452 triples)
│   ├── integrated_data.rdf     # RDF/XML format
│   ├── integrated_data.n3      # N3 format
│   └── integrated_data.nt      # N-Triples format
├── generate_data_sources.py    # Data source generator
├── requirements.txt        # Python dependencies
├── README.md              # This file
└── PROJECT_REPORT.md      # Detailed project report
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- pip package manager

### Installation

1. Clone or navigate to the project directory:
```bash
cd semantic_integration
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the System

#### 1. Generate Data Sources
```bash
python generate_data_sources.py
```
Creates three heterogeneous data sources with realistic university data.

#### 2. Run Semantic Integration
```bash
python integration/semantic_integration.py
```
Transforms all data sources into unified RDF format using the ontology.

#### 3. Execute SPARQL Queries
```bash
python queries/sparql_queries.py
```
Queries the integrated RDF data and validates semantic consistency.

## 📊 Data Sources

### 1. **SQLite Database** (`students.db`)
- **Format**: Relational database
- **Tables**: 
  - `Students` (10 records): student_id, first_name, last_name, email, date_of_birth, enrollment_year, gpa, major_department
  - `Enrollments` (15 records): enrollment_id, student_id, course_code, semester, grade, enrollment_date

### 2. **XML File** (`courses.xml`)
- **Format**: Semi-structured XML
- **Content**: 10 courses with nested instructor elements
- **Elements**: Course (courseCode, name, credits, department), Instructor (instructorID, firstName, lastName)

### 3. **CSV File** (`departments.csv`)
- **Format**: Tabular CSV
- **Records**: 6 departments
- **Columns**: department_id, department_name, building, faculty_count, established_year, budget, department_head

## 🏗️ Ontology Design

**Namespace**: `http://university.edu/ontology#`

### Classes (6)
- `Person` (base class)
  - `Student` (subclass of Person)
  - `Instructor` (subclass of Person)
- `Course`
- `Department`
- `Enrollment`

### Object Properties (7)
- `enrolledIn`: Student → Course
- `teaches`: Instructor → Course
- `offeredBy`: Course → Department
- `hasEnrollment`: Student → Enrollment
- `enrollmentFor`: Enrollment → Course
- `majorIn`: Student → Department
- `headedBy`: Department → Instructor

### Datatype Properties (20+)
Including: firstName, lastName, email, studentID, courseCode, courseName, credits, gpa, semester, grade, etc.

## 🔄 Semantic Integration

**Total RDF Triples Generated**: 452

### Mapping Summary

1. **SQLite Students → `uni:Student`**
   - Maps 10 students with 8 properties each
   - Creates `majorIn` relationships to departments

2. **SQLite Enrollments → `uni:Enrollment`**
   - Maps 15 enrollments with semester/grade data
   - Creates `hasEnrollment` and `enrollmentFor` relationships

3. **XML Courses → `uni:Course`**
   - Maps 10 courses with course details
   - Maps 8 instructors
   - Creates `teaches` and `offeredBy` relationships

4. **CSV Departments → `uni:Department`**
   - Maps 6 departments with metadata
   - Creates `headedBy` relationships to instructors

### URI Patterns
- Students: `http://university.edu/data#student_{studentID}`
- Courses: `http://university.edu/data#course_{courseCode}`
- Departments: `http://university.edu/data#dept_{deptName}`
- Instructors: `http://university.edu/data#instructor_{instructorID}`
- Enrollments: `http://university.edu/data#enrollment_{enrollmentID}`

## 🔍 SPARQL Queries

### Implemented Queries

1. **Students with Majors and GPAs**
   - Lists all students ordered by GPA
   - Joins student data with department information

2. **Courses by Instructor**
   - Shows course assignments for each instructor
   - Demonstrates one-to-many relationships

3. **Student Enrollments with Grades**
   - Complete enrollment history with grades
   - Multi-source join (students, enrollments, courses)

4. **Department Statistics**
   - Department info with course count aggregation
   - Uses GROUP BY and COUNT

5. **Computer Science Students**
   - Filtered query for specific major
   - Shows enrollments for CS students

6. **4-Credit Courses**
   - Filtered by credit hours
   - Includes instructor and department info

## ✅ Validation Results

### Semantic Consistency: **VALID ✓**

- ✓ All students have complete required properties (10/10)
- ✓ All enrollments maintain referential integrity (15/15)
- ✓ All courses have assigned instructors (10/10)
- ✓ All GPA values are valid decimals (0.0-4.0)

### Cross-Source Validation
- ✓ All course codes in enrollments match course catalog (10/10)
- ✓ All department references are valid (6/6)
- ✓ All student-course relationships preserved (15/15)

## 📈 Key Results

- **Heterogeneous Sources Unified**: 3 (SQLite, XML, CSV)
- **Total Entities Integrated**: 49 (10 students, 8 instructors, 10 courses, 6 departments, 15 enrollments)
- **RDF Triples Generated**: 452
- **Ontology Triples**: 135
- **SPARQL Queries**: 6 queries + 4 validations
- **Serialization Formats**: 4 (Turtle, RDF/XML, N3, N-Triples)

## 🛠️ Technologies Used

- **Python 3.11**: Core programming language
- **rdflib**: RDF graph manipulation and SPARQL querying
- **pandas**: CSV data processing
- **sqlite3**: Relational database access
- **xml.etree.ElementTree**: XML parsing
- **OWL**: Web Ontology Language for semantic modeling
- **RDF**: Resource Description Framework for data representation
- **SPARQL**: Query language for RDF data

## 📝 Output Files

### RDF Formats
- `integrated_data.ttl`: Human-readable Turtle format (5.7 KB)
- `integrated_data.rdf`: RDF/XML format (23 KB)
- `integrated_data.n3`: Notation3 format (5.8 KB)
- `integrated_data.nt`: N-Triples format (9 KB)

### Query Results
- `query_results.json`: Complete results with statistics
- `query_1_results.json` through `query_6_results.json`: Individual query outputs

### Documentation
- `mapping_documentation.json`: Detailed mapping specifications
- `schemas.json`: Source schema documentation

## 🎓 Use Cases

This semantic integration system can be applied to:
- **Academic Systems**: Unifying student, course, and department data
- **Enterprise Integration**: Combining data from CRM, ERP, and HR systems
- **Data Warehousing**: Creating semantic data lakes
- **Knowledge Graphs**: Building unified knowledge bases from disparate sources
- **Master Data Management**: Creating single source of truth across systems

## 📚 Further Reading

- [RDF Primer](https://www.w3.org/TR/rdf11-primer/)
- [OWL 2 Web Ontology Language](https://www.w3.org/TR/owl2-overview/)
- [SPARQL Query Language](https://www.w3.org/TR/sparql11-query/)
- [rdflib Documentation](https://rdflib.readthedocs.io/)

## 📄 License

This project is provided as-is for educational and demonstration purposes.

## 👤 Author

Developed as a demonstration of semantic data integration techniques using modern semantic web technologies.

---

**Last Updated**: 2024
**Version**: 1.0
