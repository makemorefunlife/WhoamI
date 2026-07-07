# 03_Saju_Calculation_Rules.md

## Purpose

This document defines the Saju Calculation Layer.

Its responsibility is to transform birth information into a deterministic and reusable Saju structure.

This layer performs calculation only.

It does not perform:

* Human Framework Mapping
* Personality Interpretation
* Relationship Interpretation
* Report Generation
* AI Narrative Creation

Those responsibilities belong to separate documents.

---

# Calculation Layer Overview

```text
Birth Data

↓

Four Pillars

↓

Hidden Stems

↓

Five Elements

↓

Ten Gods

↓

Seasonal Analysis

↓

Structural Relations

↓

Growth Stages

↓

Special Stars

↓

Extended NormalizedSaju
```

---

# Calculation Principles

## Principle 1

Calculation and interpretation must remain separate.

```text
Calculation Layer

≠

Interpretation Layer
```

---

## Principle 2

All calculations must be deterministic.

The same birth information must always produce the same output.

---

## Principle 3

All original Saju information must remain preserved.

Raw calculations must never be discarded.

---

## Principle 4

Human Framework logic must not exist in this document.

Human Framework belongs to:

```text
04_Saju_Human_Framework_Mapping.md
```

---

## Principle 5

This document generates calculation signals only.

No personality conclusions should be generated here.

---

# Four Pillars

The Saju system calculates:

```text
Year Pillar

Month Pillar

Day Pillar

Hour Pillar
```

Each pillar contains:

```text
Heavenly Stem

Earthly Branch
```

---

# Heavenly Stems

Allowed Values

```text
甲
乙
丙
丁
戊
己
庚
辛
壬
癸
```

Stored Example

```json
{
  "stem": "丁"
}
```

---

# Earthly Branches

Allowed Values

```text
子
丑
寅
卯
辰
巳
午
未
申
酉
戌
亥
```

Stored Example

```json
{
  "branch": "亥"
}
```

---

# Day Master

The Heavenly Stem of the Day Pillar.

Stored Example

```json
{
  "day_master": "丁"
}
```

The Day Master acts as the reference point for:

```text
Five Elements

Ten Gods

Strength Analysis

Future Expansion
```

---

# Hidden Stems

Each Earthly Branch contains one or more Hidden Stems.

Reference Table

```text
子 → 癸

丑 → 己 癸 辛

寅 → 甲 丙 戊

卯 → 乙

辰 → 戊 乙 癸

巳 → 丙 戊 庚

午 → 丁 己

未 → 己 丁 乙

申 → 庚 壬 戊

酉 → 辛

戌 → 戊 辛 丁

亥 → 壬 甲
```

Stored Example

```json
{
  "hidden_stems": [
    "壬",
    "甲"
  ]
}
```

---

# Five Elements

The system calculates the distribution of:

```text
wood

fire

earth

metal

water
```

---

## Element Mapping

### Wood

```text
甲
乙
```

### Fire

```text
丙
丁
```

### Earth

```text
戊
己
```

### Metal

```text
庚
辛
```

### Water

```text
壬
癸
```

---

## Five Element Calculation

The calculation includes:

```text
Visible Stems

+

Hidden Stems
```

Stored Example

```json
{
  "five_elements": {
    "wood": 3,
    "fire": 2,
    "earth": 1,
    "metal": 0,
    "water": 2
  }
}
```

---

# Ten Gods

Ten Gods are calculated using:

```text
Day Master

+

Target Stem
```

Calculation is based on:

```text
Element Relationship

+

Yin Yang Relationship
```

---

## Ten God Categories

```text
peer

rob_wealth

eating_god

hurting_officer

direct_wealth

indirect_wealth

direct_officer

seven_killings

direct_resource

indirect_resource
```

---

## Ten God Count

Count all Ten Gods across:

```text
Visible Stems

+

Hidden Stems
```

Stored Example

```json
{
  "ten_gods_count": {
    "peer": 2,
    "rob_wealth": 1,
    "eating_god": 3,
    "hurting_officer": 0,
    "direct_wealth": 1,
    "indirect_wealth": 0,
    "direct_officer": 2,
    "seven_killings": 1,
    "direct_resource": 2,
    "indirect_resource": 1
  }
}
```

---

# Seasonal Influence

The Month Branch determines seasonal influence.

Stored Example

```json
{
  "month_branch": "丑"
}
```

---

## Seasonal Groups

Spring

```text
寅 卯 辰
```

Summer

```text
巳 午 未
```

Autumn

```text
申 酉 戌
```

Winter

```text
亥 子 丑
```

---

# Seasonal Strength

The system calculates seasonal support for all five elements.

Stored Example

```json
{
  "seasonal_strength": {
    "wood": 120,
    "fire": 70,
    "earth": 40,
    "metal": 20,
    "water": 80
  }
}
```

---

# Day Master Strength

The system calculates overall Day Master strength.

Inputs may include:

```text
Seasonal Support

Element Distribution

Resource Support

Output Leakage

Control Relationships
```

Stored Example

```json
{
  "day_master_strength": {
    "score": 78,
    "level": "strong"
  }
}
```

Allowed Levels

```text
very_weak

weak

balanced

strong

very_strong
```

# Dominant Elements

The system identifies the dominant elements within the chart.

Dominant Elements are derived from:

```text
Five Element Distribution

+

Seasonal Influence

+

Day Master Context
```

This section stores ranking only.

No interpretation should be generated.

Stored Example

```json
{
  "dominant_elements": [
    "wood",
    "water"
  ]
}
```

---

# Dominant Ten Gods

The system identifies the dominant Ten God structures.

Dominant Ten Gods are derived from:

```text
Ten God Count

+

Relative Distribution

+

Day Master Context
```

Stored Example

```json
{
  "dominant_ten_gods": [
    "peer",
    "direct_officer"
  ]
}
```

No interpretation should be generated.

---

# Stem Relations

The system calculates Heavenly Stem relationships.

---

## Stem Combinations

Supported:

```text
甲己

乙庚

丙辛

丁壬

戊癸
```

Stored Example

```json
{
  "combinations": [
    {
      "stems": ["丁", "壬"]
    }
  ]
}
```

---

## Stem Clashes

Stored Example

```json
{
  "clashes": []
}
```

---

# Branch Relations

The system calculates Earthly Branch relationships.

---

## Six Combinations

Supported:

```text
子丑

寅亥

卯戌

辰酉

巳申

午未
```

Stored Example

```json
{
  "six_combinations": []
}
```

---

## Three Harmonies

Supported:

```text
申子辰

亥卯未

寅午戌

巳酉丑
```

Stored Example

```json
{
  "three_harmonies": []
}
```

---

## Directional Harmonies

Supported:

```text
寅卯辰

巳午未

申酉戌

亥子丑
```

Stored Example

```json
{
  "directional_harmonies": []
}
```

---

## Clashes

Supported:

```text
子午

丑未

寅申

卯酉

辰戌

巳亥
```

Stored Example

```json
{
  "clashes": []
}
```

---

## Punishments

Stored Example

```json
{
  "punishments": []
}
```

---

## Breaks

Stored Example

```json
{
  "breaks": []
}
```

---

## Harms

Stored Example

```json
{
  "harms": []
}
```

---

## Yuan Zhen

Stored Example

```json
{
  "yuan_zhen": []
}
```

---

# Growth Stages

The system calculates Twelve Growth Stages.

Supported Stages

```text
ChangSheng

MuYu

GuanDai

LinGuan

DiWang

Shuai

Bing

Si

Mu

Jue

Tai

Yang
```

Stored Example

```json
{
  "growth_stages": {
    "year": "LinGuan",
    "month": "DiWang",
    "day": "ChangSheng",
    "hour": "MuYu"
  }
}
```

---

# Special Stars

The system may calculate selected Special Stars.

Special Stars are stored for future expansion.

Special Stars must not be interpreted in this layer.

---

## Calculation Responsibility

Special Star calculations are defined in:

```text
09_Saju_Special_Stars_Rules.md
```

---

## Supported Stars (MVP Storage)

Examples:

```text
Peach Blossom

Heavenly Nobleman

Literary Star

Traveling Horse

Solitary Star
```

Stored Example

```json
{
  "special_stars": {
    "peach_blossom": [],
    "heavenly_nobleman": [],
    "literary_star": [],
    "traveling_horse": [],
    "solitary_star": []
  }
}
```

---

# Birth Time Unknown

If:

```json
{
  "birth_time_unknown": true
}
```

Then:

```text
Hour Pillar = null

Hour Hidden Stems excluded

Hour Ten Gods excluded

Hour Relations excluded

Hour Growth Stage excluded
```

Stored Example

```json
{
  "hour_pillar": null
}
```

---

# Extended NormalizedSaju Structure

Final output from this calculation layer.

```json
{
  "day_master": "丁",

  "pillars": {},

  "hidden_stems": {},

  "five_elements": {},

  "ten_gods_count": {},

  "month_branch": "丑",

  "seasonal_strength": {},

  "day_master_strength": {},

  "dominant_elements": [],

  "dominant_ten_gods": [],

  "stem_relations": {},

  "branch_relations": {},

  "growth_stages": {},

  "special_stars": {}
}
```

---

# Output Responsibility

This document ends at:

```text
Extended NormalizedSaju
```

The next layer is:

```text
Extended NormalizedSaju

↓

04_Saju_Human_Framework_Mapping.md

↓

InnateSelfProfile
```

---

# Design Principles

1. Calculation and interpretation must remain separate.
2. All calculations must be deterministic.
3. Use English keys only.
4. Preserve raw Saju information.
5. Hidden Stems must be included.
6. Birth Time Unknown must be explicitly handled.
7. Human Framework logic belongs to another layer.
8. Special Stars are optional calculation signals.
9. Extended NormalizedSaju must support future expansion.
10. No personality conclusions may be generated in this layer.

```
```

