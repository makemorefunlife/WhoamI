

# 02_Behavior_Framework.md

## Status

Draft Version: v1

Purpose:
Convert Human Framework scores into standardized behavior tags.

This document should remain lightweight.

Do NOT add relationship logic, report logic, scoring logic, or prompt logic here.

This document only defines behavior tags and behavioral interpretations.


## Purpose

Convert Human Framework scores into standardized behavior tags.

This framework serves as the official behavioral interpretation layer for:

* Relationship Engine
* Decision Engine
* Report Engine
* Coaching Engine

---

# Score Levels

```yaml
very_low: 0-20
low: 21-40
medium: 41-60
high: 61-80
very_high: 81-100
```

---

# Primary Axes

## autonomy

### Definition

The tendency to make decisions independently and maintain personal autonomy.

### Behavior Tags

```yaml
high:
  - independence
  - self_direction
  - personal_space
  - low_interference_tolerance

low:
  - shared_decision
  - collaborative_decision
  - togetherness_preference
  - external_validation
```

### Relationship Interpretation

High:

* Prefers freedom and autonomy.
* Comfortable making decisions independently.
* May feel stressed by excessive involvement or control.

Low:

* Prefers discussing decisions together.
* Feels safer when important choices are shared.
* Values partnership and collaboration.

### Common Misinterpretations

High:

* May appear distant or stubborn.

Low:

* May appear dependent or indecisive.

---

## connection

### Definition

The importance placed on emotional connection and relationship maintenance.

### Behavior Tags

```yaml
high:
  - emotional_connection
  - relationship_maintenance
  - social_sensitivity
  - contact_need

low:
  - emotional_distance
  - task_focus
  - low_contact_need
  - private_recovery
```

### Relationship Interpretation

High:

* Values emotional closeness.
* Appreciates frequent interaction and communication.

Low:

* Does not require constant connection to feel secure.
* May need more personal space.

### Common Misinterpretations

High:

* May appear emotionally demanding.

Low:

* May appear indifferent or disconnected.

---

## stability

### Definition

Preference for security, consistency, and predictability.

### Behavior Tags

```yaml
high:
  - security_need
  - consistency_preference
  - risk_awareness
  - safe_choice

low:
  - risk_tolerance
  - novelty_acceptance
  - uncertainty_tolerance
  - change_openness
```

---

## growth

### Definition

Desire for development, achievement, and future improvement.

### Behavior Tags

```yaml
high:
  - growth_drive
  - goal_orientation
  - self_improvement
  - future_focus

low:
  - present_comfort
  - low_competition_need
  - pace_preservation
  - pressure_sensitivity
```

---

## control

### Definition

Preference for planning, structure, responsibility, and predictability.

### Behavior Tags

```yaml
high:
  - planning
  - structure_need
  - predictability
  - responsibility_standard

low:
  - spontaneity
  - flow_based_action
  - low_structure_need
  - flexible_timing
```

---

## adaptability

### Definition

Ability and willingness to adjust to changing situations.

### Behavior Tags

```yaml
high:
  - change_adaptation
  - situational_flexibility
  - quick_recovery
  - environmental_openness

low:
  - change_resistance
  - adjustment_time_need
  - environmental_sensitivity
  - routine_dependence
```

---

# Secondary Axes

## stimulation

```yaml
high:
  - novelty_seeking
  - experience_drive
  - external_energy

low:
  - familiarity_preference
  - quiet_preference
  - low_stimulation_need
```

---

## self_control

```yaml
high:
  - impulse_control
  - delayed_response
  - self_discipline

low:
  - impulse_expression
  - immediate_response
  - low_delay_tolerance
```

---

## practicality

```yaml
high:
  - realistic_judgment
  - practical_choice
  - cost_benefit_thinking

low:
  - possibility_focus
  - value_based_choice
  - emotion_based_choice
```

---

## structure

```yaml
high:
  - order_preference
  - step_by_step_thinking
  - system_need

low:
  - improvisation
  - loose_process
  - open_ended_action
```

---

## empathy

```yaml
high:
  - emotional_reading
  - consideration
  - care_response

low:
  - logic_priority
  - direct_focus
  - low_emotional_reading
```

---

## conflict_style

```yaml
high:
  - direct_discussion
  - issue_clarification
  - problem_solving_talk

low:
  - conflict_avoidance
  - topic_shift
  - distance_response
```

---

## resilience

```yaml
high:
  - quick_recovery
  - failure_learning
  - emotional_bounce_back

low:
  - slow_recovery
  - rumination
  - emotional_carryover
```

---

## recognition

```yaml
high:
  - approval_sensitivity
  - being_seen_need
  - feedback_need

low:
  - internal_validation
  - self_confirmation
  - low_approval_need
```

---

## energy_style

```yaml
high:
  - active_recharge
  - social_recharge
  - movement_based_energy

low:
  - withdrawal_recharge
  - quiet_recharge
  - rest_need
```

---

## thinking_style

```yaml
high:
  - analytical_thinking
  - reasoning_need
  - cause_effect_thinking

low:
  - intuitive_thinking
  - feeling_based_processing
  - rapid_judgment
```

---

## decision_style

```yaml
high:
  - self_based_decision
  - preference_clarity
  - internal_standard

low:
  - context_based_decision
  - adaptive_choice
  - external_factor_checking
```

```
```
