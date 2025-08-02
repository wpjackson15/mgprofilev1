# Student Profile Upload Guide

This guide covers the enhanced student profile upload functionality for the My Genius Lesson Plan Generator.

## Overview

The profile upload system supports multiple file formats and provides AI-powered extraction for PDF files, making it easy to import student profiles from various sources.

## Supported File Formats

### 📄 PDF Files (AI-Powered Extraction)
- **Best for**: Documents with student information in natural language
- **Size limit**: 10MB per file
- **Processing**: Uses Claude AI to extract student profiles from text
- **Use cases**: 
  - IEP documents
  - Student assessment reports
  - Teacher notes and observations
  - Meeting minutes with student information

### 📊 CSV Files (Structured Data)
- **Best for**: Spreadsheet data with organized student information
- **Format**: Comma-separated values with headers
- **Required columns**: Name, Grade, Subject, Profile
- **Use cases**:
  - Excel exports
  - Student information systems
  - Database exports
  - Bulk student data

### 📝 TXT Files (Text-based)
- **Best for**: Simple text files with student data
- **Format**: Tab or comma-separated values
- **Use cases**:
  - Simple text exports
  - Notes files
  - Basic data files

## File Format Requirements

### CSV Format
```csv
Name,Grade,Subject,Profile
"John Smith","3","Math","John is a visual learner who enjoys hands-on activities. He struggles with abstract concepts but excels when given concrete examples. He has ADHD and benefits from frequent movement breaks."
"Maria Garcia","5","Science","Maria is bilingual (Spanish/English) and learns best through collaborative activities. She has strong verbal skills and enjoys explaining concepts to others. She needs support with written assignments."
```

### TXT Format
```
John Smith	3	Math	John is a visual learner who enjoys hands-on activities. He struggles with abstract concepts but excels when given concrete examples. He has ADHD and benefits from frequent movement breaks.
Maria Garcia	5	Science	Maria is bilingual (Spanish/English) and learns best through collaborative activities. She has strong verbal skills and enjoys explaining concepts to others. She needs support with written assignments.
```

## Upload Process

### 1. Access Upload Feature
- Navigate to the Lesson Plans page
- Click "Upload Files" button in the Student Profiles section
- Ensure you're signed in (authentication required)

### 2. Select Files
- Click "Select Files" or drag and drop files
- Multiple files can be selected at once
- Supported formats: PDF, CSV, TXT

### 3. Processing
- **PDF files**: AI processes the document to extract student information
- **CSV/TXT files**: Direct parsing of structured data
- Progress bar shows processing status
- Real-time feedback on success/errors

### 4. Validation
- Profiles are automatically validated
- Visual indicators show validation status:
  - ✅ Green: Valid profile
  - ⚠️ Yellow: Warnings (needs review)
  - ❌ Red: Validation errors

### 5. Review & Save
- Review extracted profiles before saving
- Edit any profiles that need correction
- Profiles are automatically saved to Firebase
- Access profiles across sessions

## Profile Validation

### Required Fields
- **Name**: Student's full name
- **Grade**: Grade level (K-8)
- **Subject**: Academic subject
- **Profile**: Detailed description of learning needs

### Validation Rules
- All fields must be non-empty
- Grade should be K, 1, 2, 3, 4, 5, 6, 7, or 8
- Profile should be descriptive (minimum 10 characters)
- Names should be properly formatted

### Common Issues & Solutions

#### PDF Processing Issues
- **Problem**: "No profiles found in PDF"
- **Solution**: Ensure PDF contains clear student information in text format
- **Problem**: "File too large"
- **Solution**: Use files under 10MB or split into smaller files

#### CSV Parsing Issues
- **Problem**: "Invalid CSV format"
- **Solution**: Use the provided CSV template
- **Problem**: "Missing required columns"
- **Solution**: Ensure headers are: Name, Grade, Subject, Profile

#### Validation Errors
- **Problem**: "Student name is required"
- **Solution**: Check for empty name fields in your data
- **Problem**: "Profile description is required"
- **Solution**: Ensure each student has a detailed profile description

## Best Practices

### For PDF Uploads
1. **Use clear, structured documents**
   - IEP documents work well
   - Assessment reports are ideal
   - Avoid heavily formatted or image-heavy PDFs

2. **Include comprehensive student information**
   - Learning styles and preferences
   - Strengths and challenges
   - Cultural background and language needs
   - Accommodations and modifications

3. **Format consistently**
   - Use clear headings
   - Separate student information clearly
   - Include student names prominently

### For CSV Uploads
1. **Use the provided template**
   - Download the CSV template
   - Follow the exact format
   - Include all required columns

2. **Data quality**
   - Use proper names (not initials)
   - Include detailed profile descriptions
   - Use consistent grade level formatting

3. **File preparation**
   - Remove any formatting issues
   - Ensure proper encoding (UTF-8)
   - Test with a small sample first

### For TXT Uploads
1. **Consistent formatting**
   - Use tabs or commas consistently
   - One student per line
   - Include all required fields

2. **Simple structure**
   - Avoid complex formatting
   - Use clear separators
   - Keep it readable

## Export Functionality

### Export Current Profiles
- Click "Export CSV" button in Student Profiles section
- Downloads all current profiles as CSV
- Includes creation timestamps
- Useful for backup or sharing

### Template Download
- Download CSV template from upload modal
- Use as starting point for your data
- Includes example profiles

## Firebase Integration

### Automatic Saving
- Profiles are automatically saved to Firebase
- Associated with user account
- Persistent across sessions
- Secure and private

### Data Management
- View all saved profiles
- Edit or delete individual profiles
- Export profiles for backup
- Access from any device

## Troubleshooting

### Upload Fails
1. **Check file format**: Ensure file is PDF, CSV, or TXT
2. **Check file size**: PDFs must be under 10MB
3. **Check authentication**: Must be signed in
4. **Check internet connection**: Stable connection required

### Processing Errors
1. **PDF errors**: Try a different PDF or convert to text
2. **CSV errors**: Use the template format
3. **Validation errors**: Review and fix data issues

### Performance Issues
1. **Large files**: Split into smaller files
2. **Many files**: Upload in batches
3. **Slow processing**: Wait for completion, don't refresh

## Advanced Features

### Batch Processing
- Upload multiple files at once
- Process different formats simultaneously
- Automatic deduplication

### AI Enhancement
- Intelligent profile extraction from PDFs
- Context-aware parsing
- Learning style identification

### Validation & Quality Control
- Real-time validation feedback
- Warning system for potential issues
- Edit capabilities for corrections

## Support

For additional help:
1. Check the validation messages
2. Use the provided templates
3. Review the error descriptions
4. Contact support if issues persist

## Examples

### Good PDF Content
```
Student: John Smith
Grade: 3
Subject: Math
Profile: John is a visual learner who enjoys hands-on activities. He struggles with abstract concepts but excels when given concrete examples. He has ADHD and benefits from frequent movement breaks. He responds well to visual aids and manipulatives.
```

### Good CSV Row
```csv
"Sarah Johnson","4","Science","Sarah is an auditory learner who loves discussions and group work. She has strong verbal skills and enjoys explaining concepts to others. She needs support with written assignments and benefits from graphic organizers."
```

This enhanced upload system makes it easy to import student profiles from various sources while ensuring data quality and providing a smooth user experience. 