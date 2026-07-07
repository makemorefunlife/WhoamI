# 04_Saju_Human_Framework_Mapping.md

## Purpose

This document defines how normalized Saju data is translated into the Ahaitsme Human Framework.

This is the core translation layer between:

```text
Traditional Saju Data

↓

Human Framework

↓

Innate Self Profile
```

This document does not perform Saju calculation.

Calculation is defined in:

```text
03_Saju_Calculation_Rules.md
```

This document only defines how calculated Saju values affect Human Framework scores.

---

# References

Required reference documents:

```text
guide/00_Product_Vision.md

guide/02_System_Architecture.md

framework/10_Human_Framework.md

framework/11_Comparison_Framework.md

framework/12_Terminology_Standard.md

saju/03_Saju_Calculation_Rules.md
```

---

# Mapping Philosophy

Traditional Saju concepts are never exposed directly as final output.

The system translates:

```text
ten gods

five elements

seasonal influence

relations
```

into:

```text
autonomy

connection

stability

growth

control

adaptability
```

These six axes are the only final scoring targets.

---

# Official Primary Axes

```text
autonomy
connection
stability
growth
control
adaptability
```

These axis names must never change.

---

# Score Model

All axes begin at:

```text
50
```

Final score:

```text
50

+

ten god effects

+

element effects

+

season effects

+

relation effects

=

final axis score
```

Final range:

```text
0 - 100
```

---

# Weight Priority

Relative influence:

```text
ten_gods = 50%

five_elements = 25%

season = 15%

relations = 10%
```

These weights may be tuned later.

---

# Part 1

# Ten God Mapping

## peer

```json
{
  "autonomy": 8,
  "connection": -2,
  "stability": 0,
  "growth": 3,
  "control": 4,
  "adaptability": 0
}
```

---

## rob_wealth

```json
{
  "autonomy": 6,
  "connection": -4,
  "stability": 0,
  "growth": 6,
  "control": 2,
  "adaptability": -2
}
```

---

## eating_god

```json
{
  "autonomy": 5,
  "connection": 2,
  "stability": 0,
  "growth": 3,
  "control": 0,
  "adaptability": 3
}
```

---

## hurting_officer

```json
{
  "autonomy": 8,
  "connection": 0,
  "stability": -2,
  "growth": 8,
  "control": -4,
  "adaptability": 4
}
```

---

## direct_wealth

```json
{
  "autonomy": 0,
  "connection": 3,
  "stability": 8,
  "growth": -2,
  "control": 4,
  "adaptability": 0
}
```

---

## indirect_wealth

```json
{
  "autonomy": 1,
  "connection": 5,
  "stability": 2,
  "growth": 5,
  "control": 0,
  "adaptability": 3
}
```

---

## direct_officer

```json
{
  "autonomy": -2,
  "connection": 4,
  "stability": 10,
  "growth": 0,
  "control": 10,
  "adaptability": -6
}
```

---

## seven_killings

```json
{
  "autonomy": 2,
  "connection": 0,
  "stability": 5,
  "growth": 6,
  "control": 7,
  "adaptability": -3
}
```

---

## direct_resource

```json
{
  "autonomy": 2,
  "connection": 0,
  "stability": 5,
  "growth": 0,
  "control": 5,
  "adaptability": 0
}
```

---

## indirect_resource

```json
{
  "autonomy": 4,
  "connection": -2,
  "stability": 0,
  "growth": 1,
  "control": 3,
  "adaptability": 2
}
```

---

# Part 2

# Five Element Mapping

## wood dominant

```json
{
  "autonomy": 5,
  "connection": 0,
  "stability": 0,
  "growth": 4,
  "control": 0,
  "adaptability": 2
}
```

---

## fire dominant

```json
{
  "autonomy": 4,
  "connection": 2,
  "stability": -1,
  "growth": 6,
  "control": 0,
  "adaptability": 2
}
```

---

## earth dominant

```json
{
  "autonomy": 0,
  "connection": 0,
  "stability": 7,
  "growth": -2,
  "control": 6,
  "adaptability": -4
}
```

---

## metal dominant

```json
{
  "autonomy": 0,
  "connection": -1,
  "stability": 4,
  "growth": 0,
  "control": 5,
  "adaptability": -2
}
```

---

## water dominant

```json
{
  "autonomy": 2,
  "connection": 0,
  "stability": -2,
  "growth": 1,
  "control": 0,
  "adaptability": 3
}
```

---

# Part 3

# Seasonal Mapping

## spring

```json
{
  "autonomy": 4,
  "connection": 0,
  "stability": 0,
  "growth": 3,
  "control": 0,
  "adaptability": 1
}
```

---

## summer

```json
{
  "autonomy": 3,
  "connection": 2,
  "stability": -1,
  "growth": 5,
  "control": 0,
  "adaptability": 1
}
```

---

## autumn

```json
{
  "autonomy": 0,
  "connection": 0,
  "stability": 3,
  "growth": 0,
  "control": 4,
  "adaptability": -1
}
```

---

## winter

```json
{
  "autonomy": 0,
  "connection": 0,
  "stability": 4,
  "growth": 0,
  "control": 3,
  "adaptability": -2
}
```

---

# Part 4

# Relation Mapping

## combination

```json
{
  "autonomy": 0,
  "connection": 4,
  "stability": 0,
  "growth": 0,
  "control": 0,
  "adaptability": 2
}
```

---

## clash

```json
{
  "autonomy": 0,
  "connection": -2,
  "stability": -3,
  "growth": 4,
  "control": 4,
  "adaptability": -8
}
```

---

## harm

```json
{
  "autonomy": 0,
  "connection": -3,
  "stability": -2,
  "growth": 1,
  "control": 2,
  "adaptability": -2
}
```

---

## punishment

```json
{
  "autonomy": 0,
  "connection": -2,
  "stability": -2,
  "growth": 2,
  "control": 3,
  "adaptability": -2
}
```

---

## break

```json
{
  "autonomy": 0,
  "connection": -1,
  "stability": -2,
  "growth": 2,
  "control": 1,
  "adaptability": -1
}
```

---

# Axis Generation Rules

Step 1

Calculate ten god effects.

```text
ten_gods_score
```

---

Step 2

Calculate five element effects.

```text
element_score
```

---

Step 3

Calculate seasonal effects.

```text
season_score
```

---

Step 4

Calculate relation effects.

```text
relation_score
```

---

Step 5

Combine all effects.

```text
axis_score

=

50

+

ten_gods_score

+

element_score

+

season_score

+

relation_score
```

---

Step 6

Clamp final values.

```text
minimum = 0

maximum = 100
```

---

# Output Target

This document generates:

```text
Primary Axis Scores
```

Output schema is defined in:

```text
05_Saju_Output_Schema.md
```

---

# Design Principles

1. Human Framework is the only translation layer.
2. Traditional Saju terms are not final output.
3. All scoring keys use English.
4. Primary Axes are fixed.
5. Mapping rules must remain deterministic.
6. Survey and Saju must produce comparable structures.
7. Future report engines must consume the same axis scores.
