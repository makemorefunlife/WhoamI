# 02_Saju_Input_Schema.md

## Purpose

This document defines the standard input schema for the Ahaitsme Saju System.

The goal is to collect the minimum birth information required to calculate Saju and generate an Innate Self Profile.

---

# Input Role

Saju input is used to generate:

```text
InnateSelfProfile
```

The input must support:

```text
birth data collection

location resolution

timezone handling

birth time correction

saju calculation

debugging

future expansion
```

---

# Required User Input

The user provides the following fields.

```json
{
  "birth_date": "1988-01-01",
  "birth_time": "14:30",
  "birth_time_unknown": false,
  "birth_country": "South Korea",
  "birth_city": "Seoul",
  "timezone": "Asia/Seoul",
  "calendar_type": "solar",
  "gender": "unknown"
}
```

---

# Field Definitions

## birth_date

User's birth date.

Type:

```text
string
```

Format:

```text
YYYY-MM-DD
```

Example:

```json
{
  "birth_date": "1988-01-01"
}
```

Required:

```text
true
```

---

## birth_time

User's birth time.

Type:

```text
string | null
```

Format:

```text
HH:mm
```

Example:

```json
{
  "birth_time": "14:30"
}
```

If the user does not know their birth time:

```json
{
  "birth_time": null,
  "birth_time_unknown": true
}
```

Required:

```text
false
```

---

## birth_time_unknown

Whether the user does not know their birth time.

Type:

```text
boolean
```

Default:

```text
false
```

Example:

```json
{
  "birth_time_unknown": true
}
```

If true:

```text
hour pillar is excluded

hour-based ten gods are excluded

hour-based hidden stems are excluded

hour-based relations are excluded

confidence level is lowered
```

---

## birth_country

Country of birth.

Type:

```text
string
```

Example:

```json
{
  "birth_country": "South Korea"
}
```

Required:

```text
true
```

---

## birth_city

City of birth.

Type:

```text
string
```

Example:

```json
{
  "birth_city": "Seoul"
}
```

Required:

```text
true
```

---

## timezone

IANA timezone of the birth location.

Type:

```text
string
```

Example:

```json
{
  "timezone": "Asia/Seoul"
}
```

Required:

```text
true
```

MVP policy:

```text
timezone should be resolved by the system when possible

manual user selection is allowed only as fallback
```

---

## calendar_type

Birth date calendar type.

Type:

```text
string
```

Allowed values:

```text
solar
lunar
```

Default:

```text
solar
```

MVP policy:

```text
solar is the default

lunar support may be added if calculation library supports conversion reliably
```

---

## gender

User gender.

Type:

```text
string
```

Allowed values:

```text
female
male
unknown
```

Default:

```text
unknown
```

MVP policy:

```text
gender is stored only if needed

gender is not used directly in Fast Score primary axis calculation

gender may be used later for traditional luck cycle direction or advanced reports
```

---

# System Generated Values

The system generates the following values after receiving user input.

```json
{
  "geo": {
    "latitude": 37.5665,
    "longitude": 126.978,
    "timezone": "Asia/Seoul",
    "timezone_source": "geocoding"
  }
}
```

---

# geo

## geo.latitude

Birth city latitude.

Type:

```text
number
```

Example:

```json
{
  "latitude": 37.5665
}
```

---

## geo.longitude

Birth city longitude.

Type:

```text
number
```

Example:

```json
{
  "longitude": 126.978
}
```

---

## geo.timezone

Resolved IANA timezone.

Type:

```text
string
```

Example:

```json
{
  "timezone": "Asia/Seoul"
}
```

---

## geo.timezone_source

Source of timezone resolution.

Type:

```text
string
```

Allowed examples:

```text
geocoding
cached_city_database
manual_user_selection
manual_admin_override
```

---

# Birth Time Correction

Birth time correction is stored separately.

```json
{
  "birth_time_correction": {
    "local_birth_datetime": "1988-01-01T14:30:00",
    "utc_birth_datetime": "1988-01-01T05:30:00Z",
    "timezone_offset_minutes": 540,
    "dst_applied": false,
    "standard_meridian": 135,
    "longitude_correction_minutes": -32.09,
    "equation_of_time_minutes": -3.5,
    "true_solar_time": "1988-01-01T13:54:25",
    "saju_calculation_time": "1988-01-01T13:54:25",
    "correction_method": "local_true_solar_time"
  }
}
```

---

## local_birth_datetime

Original local birth datetime entered by user.

Format:

```text
YYYY-MM-DDTHH:mm:ss
```

---

## utc_birth_datetime

UTC-converted birth datetime.

Format:

```text
ISO 8601
```

---

## timezone_offset_minutes

Timezone offset from UTC in minutes.

Example:

```text
Asia/Seoul = 540
```

---

## dst_applied

Whether daylight saving time was applied on the birth date and location.

Type:

```text
boolean
```

---

## standard_meridian

Standard longitude for the timezone.

Formula:

```text
timezone_offset_hours * 15
```

Example:

```text
UTC+9 = 135
```

---

## longitude_correction_minutes

Longitude correction based on actual birth longitude.

Formula:

```text
(actual_longitude - standard_meridian) * 4
```

---

## equation_of_time_minutes

Correction between mean solar time and apparent solar time.

MVP policy:

```text
use calculation library or stable approximation

store source or method when possible
```

---

## true_solar_time

Local birth time after longitude and equation-of-time correction.

---

## saju_calculation_time

Final datetime used for Saju calculation.

MVP policy:

```text
use birth location local time

do not simply convert overseas births into Korea time

apply timezone, daylight saving, longitude, and equation-of-time correction when available
```

---

## correction_method

Method used to calculate final Saju time.

Allowed values:

```text
local_time_only
local_with_timezone
local_true_solar_time
manual_override
```

MVP default:

```text
local_true_solar_time
```

---

# Input Validation Rules

## Required fields

The following fields must exist:

```text
birth_date

birth_country

birth_city

timezone

calendar_type
```

---

## birth_time validation

If birth_time_unknown is false:

```text
birth_time must be present

birth_time must follow HH:mm format
```

If birth_time_unknown is true:

```text
birth_time must be null

hour pillar must not be calculated
```

---

## timezone validation

timezone must be a valid IANA timezone.

Examples:

```text
Asia/Seoul

America/New_York

Europe/London

Asia/Tokyo
```

---

## calendar_type validation

Allowed values only:

```text
solar

lunar
```

---

## gender validation

Allowed values only:

```text
female

male

unknown
```

---

# Standard Saju Input Object

The full normalized input object should follow this structure.

```json
{
  "user_birth_input": {
    "birth_date": "1988-01-01",
    "birth_time": "14:30",
    "birth_time_unknown": false,
    "birth_country": "South Korea",
    "birth_city": "Seoul",
    "timezone": "Asia/Seoul",
    "calendar_type": "solar",
    "gender": "unknown"
  },
  "geo": {
    "latitude": 37.5665,
    "longitude": 126.978,
    "timezone": "Asia/Seoul",
    "timezone_source": "geocoding"
  },
  "birth_time_correction": {
    "local_birth_datetime": "1988-01-01T14:30:00",
    "utc_birth_datetime": "1988-01-01T05:30:00Z",
    "timezone_offset_minutes": 540,
    "dst_applied": false,
    "standard_meridian": 135,
    "longitude_correction_minutes": -32.09,
    "equation_of_time_minutes": -3.5,
    "true_solar_time": "1988-01-01T13:54:25",
    "saju_calculation_time": "1988-01-01T13:54:25",
    "correction_method": "local_true_solar_time"
  }
}
```

---

# Birth Time Unknown Handling

If the user does not know birth time:

```json
{
  "user_birth_input": {
    "birth_date": "1988-01-01",
    "birth_time": null,
    "birth_time_unknown": true,
    "birth_country": "South Korea",
    "birth_city": "Seoul",
    "timezone": "Asia/Seoul",
    "calendar_type": "solar",
    "gender": "unknown"
  }
}
```

The system must apply:

```text
hour pillar = null

hour-based ten gods excluded

hour-based hidden stems excluded

hour-based relation effects excluded

confidence level lowered
```

---

# Error Handling

## Missing birth_date

Return:

```json
{
  "error_code": "missing_birth_date",
  "message": "birth_date is required"
}
```

---

## Invalid birth_time

Return:

```json
{
  "error_code": "invalid_birth_time",
  "message": "birth_time must follow HH:mm format"
}
```

---

## Missing location

Return:

```json
{
  "error_code": "missing_birth_location",
  "message": "birth_country and birth_city are required"
}
```

---

## Invalid timezone

Return:

```json
{
  "error_code": "invalid_timezone",
  "message": "timezone must be a valid IANA timezone"
}
```

---

# Design Principles

1. User input must be minimal.
2. System-generated values must be stored separately.
3. Birth location and timezone must be preserved.
4. Raw user input must not be overwritten.
5. Corrected calculation time must be stored separately.
6. Overseas births must not be converted using Korea time by default.
7. Birth time unknown must be explicitly handled.
8. The input schema must support future advanced Saju analysis.
9. All keys must use English snake_case.
10. User-facing labels may be Korean, but internal keys must remain English.
