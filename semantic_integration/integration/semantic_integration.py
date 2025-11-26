"""
Semantic Integration Framework
Transforms heterogeneous data sources to RDF format using the university ontology
"""

from rdflib import Graph, Namespace, Literal, URIRef, RDF, RDFS, OWL, XSD
import sqlite3
import xml.etree.ElementTree as ET
import pandas as pd
import json
from datetime import datetime

print("="*70)
print("SEMANTIC INTEGRATION FRAMEWORK")
print("="*70)

# Define namespaces
UNI = Namespace("http://university.edu/ontology#")
DATA = Namespace("http://university.edu/data#")

# Create RDF graph
g = Graph()
g.bind("uni", UNI)
g.bind("data", DATA)
g.bind("owl", OWL)
g.bind("rdfs", RDFS)

print("\n1. Loading ontology...")
# Load the ontology
ontology_graph = Graph()
ontology_graph.parse("ontology/university_ontology.owl", format="xml")
print(f"   ✓ Loaded ontology with {len(ontology_graph)} triples")

# Merge ontology into main graph
g += ontology_graph

# ============================================================================
# MAPPING 1: SQLite Database -> RDF
# ============================================================================
print("\n2. Mapping SQLite Database (students.db) to RDF...")

conn = sqlite3.connect('data_sources/students.db')
cursor = conn.cursor()

# Map Students table
cursor.execute("SELECT * FROM Students")
students = cursor.fetchall()
student_count = 0

for student in students:
    student_id, first_name, last_name, email, dob, enroll_year, major, gpa = student
    
    # Create student URI
    student_uri = DATA[f"student_{student_id}"]
    
    # Add type
    g.add((student_uri, RDF.type, UNI.Student))
    
    # Add properties
    g.add((student_uri, UNI.studentID, Literal(str(student_id), datatype=XSD.string)))
    g.add((student_uri, UNI.firstName, Literal(first_name, datatype=XSD.string)))
    g.add((student_uri, UNI.lastName, Literal(last_name, datatype=XSD.string)))
    g.add((student_uri, UNI.email, Literal(email, datatype=XSD.string)))
    g.add((student_uri, UNI.dateOfBirth, Literal(dob, datatype=XSD.date)))
    g.add((student_uri, UNI.enrollmentYear, Literal(enroll_year, datatype=XSD.gYear)))
    g.add((student_uri, UNI.gpa, Literal(gpa, datatype=XSD.decimal)))
    
    # Link to major department (will be created from CSV)
    if major:
        dept_uri = DATA[f"dept_{major.replace(' ', '_')}"]
        g.add((student_uri, UNI.majorIn, dept_uri))
    
    student_count += 1

print(f"   ✓ Mapped {student_count} students from Students table")

# Map Enrollments table
cursor.execute("SELECT * FROM Enrollments")
enrollments = cursor.fetchall()
enrollment_count = 0

for enrollment in enrollments:
    enroll_id, student_id, course_code, semester, grade, credits = enrollment
    
    # Create enrollment URI
    enrollment_uri = DATA[f"enrollment_{enroll_id}"]
    student_uri = DATA[f"student_{student_id}"]
    course_uri = DATA[f"course_{course_code}"]
    
    # Add type
    g.add((enrollment_uri, RDF.type, UNI.Enrollment))
    
    # Add properties
    g.add((enrollment_uri, UNI.semester, Literal(semester, datatype=XSD.string)))
    g.add((enrollment_uri, UNI.grade, Literal(grade, datatype=XSD.string)))
    
    # Add relationships
    g.add((student_uri, UNI.hasEnrollment, enrollment_uri))
    g.add((enrollment_uri, UNI.enrollmentFor, course_uri))
    g.add((student_uri, UNI.enrolledIn, course_uri))
    
    enrollment_count += 1

conn.close()
print(f"   ✓ Mapped {enrollment_count} enrollments from Enrollments table")

# ============================================================================
# MAPPING 2: XML File -> RDF
# ============================================================================
print("\n3. Mapping XML File (courses.xml) to RDF...")

tree = ET.parse('data_sources/courses.xml')
root = tree.getroot()

# Remove namespace for easier parsing
for elem in root.iter():
    if '}' in elem.tag:
        elem.tag = elem.tag.split('}', 1)[1]

courses = root.findall('Course')
course_count = 0
instructor_count = 0
instructor_ids = set()

for course in courses:
    course_code = course.get('courseCode')
    course_name = course.find('CourseName').text
    department = course.find('Department').text
    credits = int(course.find('Credits').text)
    instructor_elem = course.find('Instructor')
    instructor_id = instructor_elem.get('instructorID')
    instructor_name = instructor_elem.text
    
    # Create course URI
    course_uri = DATA[f"course_{course_code}"]
    
    # Add type
    g.add((course_uri, RDF.type, UNI.Course))
    
    # Add properties
    g.add((course_uri, UNI.courseCode, Literal(course_code, datatype=XSD.string)))
    g.add((course_uri, UNI.courseName, Literal(course_name, datatype=XSD.string)))
    g.add((course_uri, UNI.credits, Literal(credits, datatype=XSD.integer)))
    
    # Link to department
    dept_uri = DATA[f"dept_{department.replace(' ', '_')}"]
    g.add((course_uri, UNI.offeredBy, dept_uri))
    
    # Create instructor if not exists
    if instructor_id not in instructor_ids:
        instructor_uri = DATA[f"instructor_{instructor_id}"]
        g.add((instructor_uri, RDF.type, UNI.Instructor))
        g.add((instructor_uri, UNI.instructorID, Literal(instructor_id, datatype=XSD.string)))
        
        # Parse instructor name
        name_parts = instructor_name.replace('Dr. ', '').split(' ')
        if len(name_parts) >= 2:
            g.add((instructor_uri, UNI.firstName, Literal(name_parts[0], datatype=XSD.string)))
            g.add((instructor_uri, UNI.lastName, Literal(' '.join(name_parts[1:]), datatype=XSD.string)))
        
        instructor_ids.add(instructor_id)
        instructor_count += 1
    else:
        instructor_uri = DATA[f"instructor_{instructor_id}"]
    
    # Link instructor to course
    g.add((instructor_uri, UNI.teaches, course_uri))
    
    course_count += 1

print(f"   ✓ Mapped {course_count} courses from XML file")
print(f"   ✓ Mapped {instructor_count} instructors from XML file")

# ============================================================================
# MAPPING 3: CSV File -> RDF
# ============================================================================
print("\n4. Mapping CSV File (departments.csv) to RDF...")

df = pd.read_csv('data_sources/departments.csv')
dept_count = 0

for _, row in df.iterrows():
    dept_id = row['department_id']
    dept_name = row['department_name']
    building = row['building']
    head_name = row['head_of_department']
    faculty_count = int(row['faculty_count'])
    established_year = int(row['established_year'])
    budget = int(row['budget'])
    
    # Create department URI
    dept_uri = DATA[f"dept_{dept_name.replace(' ', '_')}"]
    
    # Add type
    g.add((dept_uri, RDF.type, UNI.Department))
    
    # Add properties
    g.add((dept_uri, UNI.departmentID, Literal(dept_id, datatype=XSD.string)))
    g.add((dept_uri, UNI.departmentName, Literal(dept_name, datatype=XSD.string)))
    g.add((dept_uri, UNI.building, Literal(building, datatype=XSD.string)))
    g.add((dept_uri, UNI.facultyCount, Literal(faculty_count, datatype=XSD.integer)))
    g.add((dept_uri, UNI.establishedYear, Literal(established_year, datatype=XSD.gYear)))
    g.add((dept_uri, UNI.budget, Literal(budget, datatype=XSD.integer)))
    
    # Try to link department head to existing instructor
    head_name_clean = head_name.replace('Dr. ', '')
    # Search for matching instructor by last name
    last_name = head_name_clean.split(' ')[-1]
    
    for instructor_id in instructor_ids:
        instructor_uri = DATA[f"instructor_{instructor_id}"]
        # Check if this instructor's last name matches
        for _, _, ln_literal in g.triples((instructor_uri, UNI.lastName, None)):
            if str(ln_literal) == last_name:
                g.add((dept_uri, UNI.headedBy, instructor_uri))
                break
    
    dept_count += 1

print(f"   ✓ Mapped {dept_count} departments from CSV file")

# ============================================================================
# Save integrated RDF data
# ============================================================================
print("\n5. Saving integrated RDF data...")

# Save in multiple formats
output_formats = {
    'turtle': 'output/integrated_data.ttl',
    'xml': 'output/integrated_data.rdf',
    'n3': 'output/integrated_data.n3',
    'nt': 'output/integrated_data.nt'
}

for format_name, filepath in output_formats.items():
    g.serialize(destination=filepath, format=format_name)
    print(f"   ✓ Saved {filepath}")

# ============================================================================
# Generate mapping documentation
# ============================================================================
print("\n6. Creating mapping documentation...")

mapping_doc = {
    "mappings": {
        "Students_table_to_RDF": {
            "source": "students.db - Students table",
            "target_class": "uni:Student",
            "mappings": {
                "student_id": "uni:studentID (xsd:string)",
                "first_name": "uni:firstName (xsd:string)",
                "last_name": "uni:lastName (xsd:string)",
                "email": "uni:email (xsd:string)",
                "date_of_birth": "uni:dateOfBirth (xsd:date)",
                "enrollment_year": "uni:enrollmentYear (xsd:gYear)",
                "gpa": "uni:gpa (xsd:decimal)",
                "major": "uni:majorIn -> uni:Department"
            },
            "uri_pattern": "data:student_{student_id}"
        },
        "Enrollments_table_to_RDF": {
            "source": "students.db - Enrollments table",
            "target_class": "uni:Enrollment",
            "mappings": {
                "enrollment_id": "URI identifier",
                "student_id": "uni:hasEnrollment (from Student)",
                "course_code": "uni:enrollmentFor -> uni:Course",
                "semester": "uni:semester (xsd:string)",
                "grade": "uni:grade (xsd:string)"
            },
            "uri_pattern": "data:enrollment_{enrollment_id}",
            "relationships": [
                "Student -> uni:hasEnrollment -> Enrollment",
                "Enrollment -> uni:enrollmentFor -> Course",
                "Student -> uni:enrolledIn -> Course"
            ]
        },
        "Courses_XML_to_RDF": {
            "source": "courses.xml - Course elements",
            "target_class": "uni:Course",
            "mappings": {
                "@courseCode": "uni:courseCode (xsd:string)",
                "CourseName": "uni:courseName (xsd:string)",
                "Department": "uni:offeredBy -> uni:Department",
                "Credits": "uni:credits (xsd:integer)",
                "Instructor/@instructorID": "Creates uni:Instructor",
                "Instructor/text()": "Instructor name (firstName, lastName)"
            },
            "uri_pattern": "data:course_{courseCode}"
        },
        "Departments_CSV_to_RDF": {
            "source": "departments.csv",
            "target_class": "uni:Department",
            "mappings": {
                "department_id": "uni:departmentID (xsd:string)",
                "department_name": "uni:departmentName (xsd:string)",
                "building": "uni:building (xsd:string)",
                "faculty_count": "uni:facultyCount (xsd:integer)",
                "established_year": "uni:establishedYear (xsd:gYear)",
                "budget": "uni:budget (xsd:integer)",
                "head_of_department": "uni:headedBy -> uni:Instructor"
            },
            "uri_pattern": "data:dept_{department_name}"
        }
    },
    "statistics": {
        "total_triples": len(g),
        "students": student_count,
        "enrollments": enrollment_count,
        "courses": course_count,
        "instructors": instructor_count,
        "departments": dept_count
    }
}

with open('mappings/mapping_documentation.json', 'w', encoding='utf-8') as f:
    json.dump(mapping_doc, f, indent=2)

print(f"   ✓ Created mapping_documentation.json")

# ============================================================================
# Summary
# ============================================================================
print("\n" + "="*70)
print("INTEGRATION SUMMARY")
print("="*70)
print(f"\nTotal RDF Triples: {len(g):,}")
print(f"\nEntities Created:")
print(f"  - Students: {student_count}")
print(f"  - Enrollments: {enrollment_count}")
print(f"  - Courses: {course_count}")
print(f"  - Instructors: {instructor_count}")
print(f"  - Departments: {dept_count}")
print(f"\nOutput Files:")
print(f"  - Turtle format: output/integrated_data.ttl")
print(f"  - RDF/XML format: output/integrated_data.rdf")
print(f"  - N3 format: output/integrated_data.n3")
print(f"  - N-Triples format: output/integrated_data.nt")
print(f"\nMapping Documentation: mappings/mapping_documentation.json")
print("\n✓ Semantic integration complete!")
print("="*70)
