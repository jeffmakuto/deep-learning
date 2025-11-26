"""
Generate heterogeneous data sources for semantic integration
Domain: University Academic System
"""

import pandas as pd
import sqlite3
import json
import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
import random

print("="*70)
print("GENERATING HETEROGENEOUS DATA SOURCES")
print("="*70)

# Set random seed for reproducibility
random.seed(42)

# ============================================================================
# DATA SOURCE 1: SQLite Relational Database (Students and Enrollments)
# ============================================================================
print("\n1. Creating SQLite Database (students.db)...")

# Connect to SQLite database
conn = sqlite3.connect('data_sources/students.db')
cursor = conn.cursor()

# Create Students table
cursor.execute('''
CREATE TABLE IF NOT EXISTS Students (
    student_id INTEGER PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    date_of_birth TEXT,
    enrollment_year INTEGER,
    major TEXT,
    gpa REAL
)
''')

# Create Enrollments table
cursor.execute('''
CREATE TABLE IF NOT EXISTS Enrollments (
    enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    course_code TEXT,
    semester TEXT,
    grade TEXT,
    credits INTEGER,
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
)
''')

# Generate student data
students_data = [
    (1001, 'John', 'Smith', 'john.smith@university.edu', '2002-05-15', 2021, 'Computer Science', 3.7),
    (1002, 'Emily', 'Johnson', 'emily.j@university.edu', '2001-08-22', 2020, 'Mathematics', 3.9),
    (1003, 'Michael', 'Williams', 'm.williams@university.edu', '2002-11-30', 2021, 'Physics', 3.5),
    (1004, 'Sarah', 'Brown', 'sarah.brown@university.edu', '2003-03-10', 2022, 'Computer Science', 3.8),
    (1005, 'David', 'Jones', 'david.jones@university.edu', '2001-12-05', 2020, 'Engineering', 3.6),
    (1006, 'Lisa', 'Garcia', 'lisa.garcia@university.edu', '2002-07-18', 2021, 'Biology', 3.4),
    (1007, 'James', 'Miller', 'james.m@university.edu', '2003-01-25', 2022, 'Mathematics', 3.9),
    (1008, 'Maria', 'Davis', 'maria.davis@university.edu', '2002-09-12', 2021, 'Chemistry', 3.7),
    (1009, 'Robert', 'Rodriguez', 'robert.r@university.edu', '2001-06-08', 2020, 'Computer Science', 3.5),
    (1010, 'Jennifer', 'Martinez', 'jennifer.m@university.edu', '2003-04-20', 2022, 'Engineering', 3.8),
]

cursor.executemany('INSERT INTO Students VALUES (?,?,?,?,?,?,?,?)', students_data)

# Generate enrollment data
enrollments_data = [
    (1001, 'CS101', 'Fall 2021', 'A', 3),
    (1001, 'CS201', 'Spring 2022', 'A-', 3),
    (1001, 'MATH150', 'Fall 2021', 'B+', 4),
    (1002, 'MATH201', 'Fall 2020', 'A', 4),
    (1002, 'MATH301', 'Spring 2021', 'A', 3),
    (1002, 'CS101', 'Fall 2020', 'A-', 3),
    (1003, 'PHYS201', 'Fall 2021', 'B+', 4),
    (1003, 'PHYS301', 'Spring 2022', 'A-', 3),
    (1003, 'MATH150', 'Fall 2021', 'B', 4),
    (1004, 'CS101', 'Fall 2022', 'A', 3),
    (1004, 'CS201', 'Spring 2023', 'A', 3),
    (1004, 'ENG101', 'Fall 2022', 'B+', 3),
    (1005, 'ENG201', 'Fall 2020', 'B+', 4),
    (1005, 'ENG301', 'Spring 2021', 'A-', 3),
    (1005, 'MATH150', 'Fall 2020', 'B', 4),
]

cursor.executemany('INSERT INTO Enrollments (student_id, course_code, semester, grade, credits) VALUES (?,?,?,?,?)', 
                   enrollments_data)

conn.commit()
conn.close()

print(f"   ✓ Created Students table with {len(students_data)} records")
print(f"   ✓ Created Enrollments table with {len(enrollments_data)} records")

# ============================================================================
# DATA SOURCE 2: XML File (Courses and Instructors)
# ============================================================================
print("\n2. Creating XML File (courses.xml)...")

# Create root element
root = ET.Element('UniversityCourses')
root.set('xmlns', 'http://university.edu/courses')
root.set('version', '1.0')

# Course data
courses = [
    {'code': 'CS101', 'name': 'Introduction to Programming', 'dept': 'Computer Science', 
     'credits': 3, 'instructor': 'Dr. Alan Turing', 'instructor_id': 'I001'},
    {'code': 'CS201', 'name': 'Data Structures', 'dept': 'Computer Science', 
     'credits': 3, 'instructor': 'Dr. Grace Hopper', 'instructor_id': 'I002'},
    {'code': 'MATH150', 'name': 'Calculus I', 'dept': 'Mathematics', 
     'credits': 4, 'instructor': 'Dr. Emmy Noether', 'instructor_id': 'I003'},
    {'code': 'MATH201', 'name': 'Linear Algebra', 'dept': 'Mathematics', 
     'credits': 4, 'instructor': 'Dr. Carl Gauss', 'instructor_id': 'I004'},
    {'code': 'MATH301', 'name': 'Abstract Algebra', 'dept': 'Mathematics', 
     'credits': 3, 'instructor': 'Dr. Emmy Noether', 'instructor_id': 'I003'},
    {'code': 'PHYS201', 'name': 'Classical Mechanics', 'dept': 'Physics', 
     'credits': 4, 'instructor': 'Dr. Isaac Newton', 'instructor_id': 'I005'},
    {'code': 'PHYS301', 'name': 'Quantum Mechanics', 'dept': 'Physics', 
     'credits': 3, 'instructor': 'Dr. Marie Curie', 'instructor_id': 'I006'},
    {'code': 'ENG101', 'name': 'Engineering Fundamentals', 'dept': 'Engineering', 
     'credits': 3, 'instructor': 'Dr. Nikola Tesla', 'instructor_id': 'I007'},
    {'code': 'ENG201', 'name': 'Thermodynamics', 'dept': 'Engineering', 
     'credits': 4, 'instructor': 'Dr. James Watt', 'instructor_id': 'I008'},
    {'code': 'ENG301', 'name': 'Control Systems', 'dept': 'Engineering', 
     'credits': 3, 'instructor': 'Dr. Nikola Tesla', 'instructor_id': 'I007'},
]

for course in courses:
    course_elem = ET.SubElement(root, 'Course')
    course_elem.set('courseCode', course['code'])
    
    ET.SubElement(course_elem, 'CourseName').text = course['name']
    ET.SubElement(course_elem, 'Department').text = course['dept']
    ET.SubElement(course_elem, 'Credits').text = str(course['credits'])
    
    instructor_elem = ET.SubElement(course_elem, 'Instructor')
    instructor_elem.set('instructorID', course['instructor_id'])
    instructor_elem.text = course['instructor']

# Pretty print XML
xml_str = minidom.parseString(ET.tostring(root)).toprettyxml(indent='  ')

with open('data_sources/courses.xml', 'w', encoding='utf-8') as f:
    f.write(xml_str)

print(f"   ✓ Created courses.xml with {len(courses)} courses")

# ============================================================================
# DATA SOURCE 3: CSV File (Departments and Faculty)
# ============================================================================
print("\n3. Creating CSV File (departments.csv)...")

departments_data = {
    'department_id': ['D001', 'D002', 'D003', 'D004', 'D005', 'D006'],
    'department_name': ['Computer Science', 'Mathematics', 'Physics', 'Engineering', 'Biology', 'Chemistry'],
    'building': ['Tech Center', 'Science Hall', 'Physics Building', 'Engineering Complex', 'Life Sciences', 'Chemistry Lab'],
    'head_of_department': ['Dr. Donald Knuth', 'Dr. Emmy Noether', 'Dr. Richard Feynman', 
                           'Dr. Nikola Tesla', 'Dr. Charles Darwin', 'Dr. Marie Curie'],
    'faculty_count': [15, 12, 10, 18, 14, 11],
    'established_year': [1985, 1970, 1975, 1980, 1972, 1978],
    'budget': [2500000, 1800000, 1500000, 3000000, 1600000, 1700000]
}

df_departments = pd.DataFrame(departments_data)
df_departments.to_csv('data_sources/departments.csv', index=False)

print(f"   ✓ Created departments.csv with {len(df_departments)} departments")

# ============================================================================
# Create JSON schema documentation
# ============================================================================
print("\n4. Creating schema documentation (schemas.json)...")

schemas = {
    "relational_database": {
        "type": "SQLite",
        "file": "students.db",
        "tables": {
            "Students": {
                "columns": ["student_id", "first_name", "last_name", "email", 
                           "date_of_birth", "enrollment_year", "major", "gpa"],
                "primary_key": "student_id",
                "description": "Student personal and academic information"
            },
            "Enrollments": {
                "columns": ["enrollment_id", "student_id", "course_code", 
                           "semester", "grade", "credits"],
                "primary_key": "enrollment_id",
                "foreign_keys": {"student_id": "Students.student_id"},
                "description": "Course enrollment records"
            }
        }
    },
    "xml_file": {
        "type": "XML",
        "file": "courses.xml",
        "structure": {
            "root": "UniversityCourses",
            "elements": {
                "Course": {
                    "attributes": ["courseCode"],
                    "children": ["CourseName", "Department", "Credits", "Instructor"],
                    "Instructor": {
                        "attributes": ["instructorID"],
                        "text": "Instructor name"
                    }
                }
            }
        },
        "description": "Course catalog with instructor information"
    },
    "csv_file": {
        "type": "CSV",
        "file": "departments.csv",
        "columns": {
            "department_id": "string - Primary key",
            "department_name": "string - Department name",
            "building": "string - Building location",
            "head_of_department": "string - Department head name",
            "faculty_count": "integer - Number of faculty",
            "established_year": "integer - Year established",
            "budget": "integer - Annual budget in USD"
        },
        "description": "Department information and resources"
    }
}

with open('data_sources/schemas.json', 'w', encoding='utf-8') as f:
    json.dump(schemas, f, indent=2)

print(f"   ✓ Created schemas.json documentation")

# ============================================================================
# Summary
# ============================================================================
print("\n" + "="*70)
print("DATA GENERATION SUMMARY")
print("="*70)
print(f"\n✓ Data Source 1 (Relational): SQLite database 'students.db'")
print(f"    - Students table: {len(students_data)} records")
print(f"    - Enrollments table: {len(enrollments_data)} records")

print(f"\n✓ Data Source 2 (Semi-structured): XML file 'courses.xml'")
print(f"    - Courses: {len(courses)} records")
print(f"    - Unique instructors: {len(set(c['instructor_id'] for c in courses))}")

print(f"\n✓ Data Source 3 (Tabular): CSV file 'departments.csv'")
print(f"    - Departments: {len(df_departments)} records")

print(f"\n✓ Schema documentation: 'schemas.json'")
print("\nAll data sources created successfully!")
print("="*70)
