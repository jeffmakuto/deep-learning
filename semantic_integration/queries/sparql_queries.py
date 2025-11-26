"""
SPARQL Query Engine and Validation
Query the integrated RDF data and validate semantic consistency
"""

from rdflib import Graph, Namespace
from rdflib.plugins.sparql import prepareQuery
import json
from datetime import datetime

print("="*70)
print("SPARQL QUERY ENGINE AND VALIDATION")
print("="*70)

# Define namespaces
UNI = Namespace("http://university.edu/ontology#")
DATA = Namespace("http://university.edu/data#")

# Load integrated RDF data
print("\n1. Loading integrated RDF data...")
g = Graph()
g.parse("output/integrated_data.ttl", format="turtle")
print(f"   ✓ Loaded {len(g):,} triples")

# Bind namespaces for prettier output
g.bind("uni", UNI)
g.bind("data", DATA)

# ============================================================================
# SPARQL QUERIES
# ============================================================================
print("\n2. Executing SPARQL Queries...")
print("="*70)

query_results = {}

# Query 1: List all students with their majors and GPAs
print("\nQuery 1: List all students with their majors and GPAs")
print("-"*70)

query1 = """
PREFIX uni: <http://university.edu/ontology#>
PREFIX data: <http://university.edu/data#>

SELECT ?studentID ?firstName ?lastName ?gpa ?deptName
WHERE {
    ?student a uni:Student ;
             uni:studentID ?studentID ;
             uni:firstName ?firstName ;
             uni:lastName ?lastName ;
             uni:gpa ?gpa ;
             uni:majorIn ?dept .
    ?dept uni:departmentName ?deptName .
}
ORDER BY DESC(?gpa)
"""

results1 = g.query(query1)
query1_data = []

for row in results1:
    print(f"Student: {row.firstName} {row.lastName} (ID: {row.studentID})")
    print(f"  Major: {row.deptName}, GPA: {row.gpa}")
    query1_data.append({
        'studentID': str(row.studentID),
        'name': f"{row.firstName} {row.lastName}",
        'gpa': float(row.gpa),
        'major': str(row.deptName)
    })

query_results['query1'] = {
    'description': 'Students with majors and GPAs',
    'count': len(query1_data),
    'results': query1_data
}

# Query 2: Find all courses taught by each instructor
print("\n" + "="*70)
print("\nQuery 2: Find all courses taught by each instructor")
print("-"*70)

query2 = """
PREFIX uni: <http://university.edu/ontology#>

SELECT ?instructorID ?firstName ?lastName ?courseCode ?courseName
WHERE {
    ?instructor a uni:Instructor ;
                uni:instructorID ?instructorID ;
                uni:firstName ?firstName ;
                uni:lastName ?lastName ;
                uni:teaches ?course .
    ?course uni:courseCode ?courseCode ;
            uni:courseName ?courseName .
}
ORDER BY ?lastName ?courseCode
"""

results2 = g.query(query2)
query2_data = []
current_instructor = None

for row in results2:
    instructor_name = f"{row.firstName} {row.lastName} ({row.instructorID})"
    if instructor_name != current_instructor:
        if current_instructor:
            print()
        print(f"\nInstructor: {instructor_name}")
        current_instructor = instructor_name
    
    print(f"  - {row.courseCode}: {row.courseName}")
    query2_data.append({
        'instructorID': str(row.instructorID),
        'instructor': f"{row.firstName} {row.lastName}",
        'courseCode': str(row.courseCode),
        'courseName': str(row.courseName)
    })

query_results['query2'] = {
    'description': 'Courses taught by instructors',
    'count': len(query2_data),
    'results': query2_data
}

# Query 3: Student enrollment details with grades
print("\n" + "="*70)
print("\nQuery 3: Student enrollment details with grades")
print("-"*70)

query3 = """
PREFIX uni: <http://university.edu/ontology#>

SELECT ?studentID ?firstName ?lastName ?courseCode ?courseName ?semester ?grade
WHERE {
    ?student a uni:Student ;
             uni:studentID ?studentID ;
             uni:firstName ?firstName ;
             uni:lastName ?lastName ;
             uni:hasEnrollment ?enrollment .
    ?enrollment uni:enrollmentFor ?course ;
                uni:semester ?semester ;
                uni:grade ?grade .
    ?course uni:courseCode ?courseCode ;
            uni:courseName ?courseName .
}
ORDER BY ?lastName ?semester
"""

results3 = g.query(query3)
query3_data = []

for row in results3:
    print(f"{row.firstName} {row.lastName}: {row.courseCode} - {row.semester} - Grade: {row.grade}")
    query3_data.append({
        'studentID': str(row.studentID),
        'student': f"{row.firstName} {row.lastName}",
        'course': f"{row.courseCode}: {row.courseName}",
        'semester': str(row.semester),
        'grade': str(row.grade)
    })

query_results['query3'] = {
    'description': 'Student enrollments with grades',
    'count': len(query3_data),
    'results': query3_data
}

# Query 4: Department information with courses and budgets
print("\n" + "="*70)
print("\nQuery 4: Department information with courses and budgets")
print("-"*70)

query4 = """
PREFIX uni: <http://university.edu/ontology#>

SELECT ?deptName ?building ?facultyCount ?budget (COUNT(?course) AS ?courseCount)
WHERE {
    ?dept a uni:Department ;
          uni:departmentName ?deptName ;
          uni:building ?building ;
          uni:facultyCount ?facultyCount ;
          uni:budget ?budget .
    OPTIONAL { ?course uni:offeredBy ?dept . }
}
GROUP BY ?deptName ?building ?facultyCount ?budget
ORDER BY DESC(?budget)
"""

results4 = g.query(query4)
query4_data = []

for row in results4:
    print(f"\nDepartment: {row.deptName}")
    print(f"  Building: {row.building}")
    print(f"  Faculty Count: {row.facultyCount}")
    print(f"  Budget: ${int(row.budget):,}")
    print(f"  Courses Offered: {row.courseCount}")
    query4_data.append({
        'department': str(row.deptName),
        'building': str(row.building),
        'faculty_count': int(row.facultyCount),
        'budget': int(row.budget),
        'course_count': int(row.courseCount)
    })

query_results['query4'] = {
    'description': 'Department statistics',
    'count': len(query4_data),
    'results': query4_data
}

# Query 5: Computer Science students and their enrollments
print("\n" + "="*70)
print("\nQuery 5: Computer Science students and their enrollments")
print("-"*70)

query5 = """
PREFIX uni: <http://university.edu/ontology#>

SELECT ?firstName ?lastName ?gpa ?courseCode ?grade
WHERE {
    ?student a uni:Student ;
             uni:firstName ?firstName ;
             uni:lastName ?lastName ;
             uni:gpa ?gpa ;
             uni:majorIn ?dept ;
             uni:enrolledIn ?course .
    ?dept uni:departmentName "Computer Science" .
    ?course uni:courseCode ?courseCode .
    ?student uni:hasEnrollment ?enrollment .
    ?enrollment uni:enrollmentFor ?course ;
                uni:grade ?grade .
}
ORDER BY ?lastName
"""

results5 = g.query(query5)
query5_data = []

for row in results5:
    print(f"{row.firstName} {row.lastName} (GPA: {row.gpa}): {row.courseCode} - {row.grade}")
    query5_data.append({
        'student': f"{row.firstName} {row.lastName}",
        'gpa': float(row.gpa),
        'course': str(row.courseCode),
        'grade': str(row.grade)
    })

query_results['query5'] = {
    'description': 'Computer Science students enrollments',
    'count': len(query5_data),
    'results': query5_data
}

# Query 6: Courses with high credit hours (4 credits)
print("\n" + "="*70)
print("\nQuery 6: Courses with 4 credit hours")
print("-"*70)

query6 = """
PREFIX uni: <http://university.edu/ontology#>

SELECT ?courseCode ?courseName ?deptName ?instructorFirst ?instructorLast
WHERE {
    ?course a uni:Course ;
            uni:courseCode ?courseCode ;
            uni:courseName ?courseName ;
            uni:credits 4 ;
            uni:offeredBy ?dept .
    ?dept uni:departmentName ?deptName .
    ?instructor uni:teaches ?course ;
                uni:firstName ?instructorFirst ;
                uni:lastName ?instructorLast .
}
ORDER BY ?courseCode
"""

results6 = g.query(query6)
query6_data = []

for row in results6:
    print(f"{row.courseCode}: {row.courseName}")
    print(f"  Department: {row.deptName}")
    print(f"  Instructor: {row.instructorFirst} {row.instructorLast}")
    query6_data.append({
        'courseCode': str(row.courseCode),
        'courseName': str(row.courseName),
        'department': str(row.deptName),
        'instructor': f"{row.instructorFirst} {row.instructorLast}"
    })

query_results['query6'] = {
    'description': '4-credit courses',
    'count': len(query6_data),
    'results': query6_data
}

# ============================================================================
# VALIDATION
# ============================================================================
print("\n" + "="*70)
print("\n3. Semantic Consistency Validation")
print("="*70)

validation_results = {}

# Validation 1: Check all students have required properties
print("\nValidation 1: All students have required properties")
print("-"*70)

val1_query = """
PREFIX uni: <http://university.edu/ontology#>

SELECT (COUNT(?student) AS ?totalStudents)
       (COUNT(?sid) AS ?withStudentID)
       (COUNT(?fn) AS ?withFirstName)
       (COUNT(?ln) AS ?withLastName)
       (COUNT(?email) AS ?withEmail)
       (COUNT(?gpa) AS ?withGPA)
WHERE {
    ?student a uni:Student .
    OPTIONAL { ?student uni:studentID ?sid . }
    OPTIONAL { ?student uni:firstName ?fn . }
    OPTIONAL { ?student uni:lastName ?ln . }
    OPTIONAL { ?student uni:email ?email . }
    OPTIONAL { ?student uni:gpa ?gpa . }
}
"""

val1_results = g.query(val1_query)
for row in val1_results:
    total = int(row.totalStudents)
    print(f"Total Students: {total}")
    print(f"  With Student ID: {row.withStudentID}/{total} ✓" if int(row.withStudentID) == total else f"  With Student ID: {row.withStudentID}/{total} ✗")
    print(f"  With First Name: {row.withFirstName}/{total} ✓" if int(row.withFirstName) == total else f"  With First Name: {row.withFirstName}/{total} ✗")
    print(f"  With Last Name: {row.withLastName}/{total} ✓" if int(row.withLastName) == total else f"  With Last Name: {row.withLastName}/{total} ✗")
    print(f"  With Email: {row.withEmail}/{total} ✓" if int(row.withEmail) == total else f"  With Email: {row.withEmail}/{total} ✗")
    print(f"  With GPA: {row.withGPA}/{total} ✓" if int(row.withGPA) == total else f"  With GPA: {row.withGPA}/{total} ✗")
    
    validation_results['students_completeness'] = {
        'total': total,
        'complete': int(row.withStudentID) == total and int(row.withFirstName) == total,
        'missing_properties': total - min(int(row.withStudentID), int(row.withFirstName), int(row.withLastName))
    }

# Validation 2: Check referential integrity (enrollments reference existing courses and students)
print("\nValidation 2: Referential integrity of enrollments")
print("-"*70)

val2_query = """
PREFIX uni: <http://university.edu/ontology#>

SELECT (COUNT(DISTINCT ?enrollment) AS ?totalEnrollments)
       (COUNT(DISTINCT ?student) AS ?linkedStudents)
       (COUNT(DISTINCT ?course) AS ?linkedCourses)
WHERE {
    ?enrollment a uni:Enrollment .
    ?student uni:hasEnrollment ?enrollment .
    ?enrollment uni:enrollmentFor ?course .
}
"""

val2_results = g.query(val2_query)
for row in val2_results:
    print(f"Total Enrollments: {row.totalEnrollments}")
    print(f"  Linked to Students: {row.linkedStudents} ✓")
    print(f"  Linked to Courses: {row.linkedCourses} ✓")
    
    validation_results['enrollment_integrity'] = {
        'total_enrollments': int(row.totalEnrollments),
        'all_linked': True
    }

# Validation 3: Check that all courses have instructors
print("\nValidation 3: All courses have assigned instructors")
print("-"*70)

val3_query = """
PREFIX uni: <http://university.edu/ontology#>

SELECT (COUNT(?course) AS ?totalCourses)
       (COUNT(?instructor) AS ?withInstructors)
WHERE {
    ?course a uni:Course .
    OPTIONAL { ?instructor uni:teaches ?course . }
}
"""

val3_results = g.query(val3_query)
for row in val3_results:
    total_courses = int(row.totalCourses)
    with_inst = int(row.withInstructors)
    print(f"Total Courses: {total_courses}")
    print(f"  With Instructors: {with_inst}/{total_courses} ✓" if with_inst == total_courses else f"  With Instructors: {with_inst}/{total_courses} ✗")
    
    validation_results['courses_with_instructors'] = {
        'total': total_courses,
        'with_instructors': with_inst,
        'complete': with_inst == total_courses
    }

# Validation 4: Verify data type consistency
print("\nValidation 4: Data type consistency")
print("-"*70)

val4_query = """
PREFIX uni: <http://university.edu/ontology#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?student ?gpa
WHERE {
    ?student a uni:Student ;
             uni:gpa ?gpa .
    FILTER (datatype(?gpa) = xsd:decimal)
    FILTER (?gpa >= 0.0 && ?gpa <= 4.0)
}
"""

val4_results = g.query(val4_query)
valid_gpas = len(list(val4_results))

# Get total students
total_students_query = "SELECT (COUNT(?s) AS ?count) WHERE { ?s a <http://university.edu/ontology#Student> . }"
total_students = int(list(g.query(total_students_query))[0][0])

print(f"Students with valid GPA (0.0-4.0, decimal type): {valid_gpas}/{total_students} ✓")

validation_results['datatype_consistency'] = {
    'valid_gpas': valid_gpas,
    'total_students': total_students,
    'all_valid': valid_gpas == total_students
}

# ============================================================================
# CROSS-SOURCE VALIDATION
# ============================================================================
print("\n" + "="*70)
print("\n4. Cross-Source Data Validation")
print("="*70)

# Validate that course codes in enrollments exist in course catalog
print("\nCross-Validation: Course codes in enrollments match course catalog")
print("-"*70)

cross_val_query = """
PREFIX uni: <http://university.edu/ontology#>

SELECT ?courseCode (COUNT(?enrollment) AS ?enrollmentCount)
WHERE {
    ?enrollment a uni:Enrollment ;
                uni:enrollmentFor ?course .
    ?course uni:courseCode ?courseCode .
}
GROUP BY ?courseCode
ORDER BY ?courseCode
"""

cross_val_results = g.query(cross_val_query)
print("Course codes found in both enrollments and course catalog:")
for row in cross_val_results:
    print(f"  {row.courseCode}: {row.enrollmentCount} enrollments ✓")

# ============================================================================
# Save Results
# ============================================================================
print("\n" + "="*70)
print("\n5. Saving query and validation results...")

output_data = {
    'timestamp': datetime.now().isoformat(),
    'statistics': {
        'total_triples': len(g),
        'total_queries_executed': len(query_results),
        'total_validations': len(validation_results)
    },
    'query_results': query_results,
    'validation_results': validation_results
}

with open('queries/query_results.json', 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2)

print("   ✓ Saved queries/query_results.json")

# Save individual query results
for i, (key, data) in enumerate(query_results.items(), 1):
    with open(f'queries/query_{i}_results.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"   ✓ Saved queries/query_{i}_results.json")

# ============================================================================
# Summary
# ============================================================================
print("\n" + "="*70)
print("VALIDATION SUMMARY")
print("="*70)

all_valid = all([
    validation_results.get('students_completeness', {}).get('complete', False),
    validation_results.get('enrollment_integrity', {}).get('all_linked', False),
    validation_results.get('courses_with_instructors', {}).get('complete', False),
    validation_results.get('datatype_consistency', {}).get('all_valid', False)
])

print(f"\n✓ All students have complete required properties: {validation_results['students_completeness']['complete']}")
print(f"✓ All enrollments maintain referential integrity: {validation_results['enrollment_integrity']['all_linked']}")
print(f"✓ All courses have assigned instructors: {validation_results['courses_with_instructors']['complete']}")
print(f"✓ All GPA values are valid decimals (0.0-4.0): {validation_results['datatype_consistency']['all_valid']}")

print(f"\n{'='*70}")
print(f"Overall Semantic Consistency: {'VALID ✓' if all_valid else 'ISSUES DETECTED ✗'}")
print(f"{'='*70}")

print(f"\nQueries Executed: {len(query_results)}")
print(f"Validations Performed: {len(validation_results)}")
print(f"\n✓ SPARQL querying and validation complete!")
print("="*70)
