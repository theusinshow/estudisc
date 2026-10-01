# Golden Lesson — MAT-07 Percentage

Status: **Regression fixture specification**
Kind: `CORE`
Target: 30–40 min

## Concepts

- MAT.PCT.CONCEPT
- MAT.PCT.CONVERT
- MAT.PCT.CALCULATE
- MAT.PCT.DISCOUNT
- MAT.PCT.INCREASE
- MAT.PCT.INTERPRET

## Prerequisites

- MAT.FRACTION.MEANING
- MAT.DECIMAL.MEANING
- MAT.PROPORTION.CONCEPT

## Required flow

1. Retrieval: fraction/decimal conversion.
2. Context hook: discount.
3. Numeric explorer.
4. Concept: percent as per hundred.
5. Fraction ↔ decimal ↔ percent conversion.
6. Worked example.
7. Guided calculation.
8. Independent calculation.
9. Discount vs final-price contrast.
10. Mixed practice.
11. IFSC-style contextual transfer.
12. Exit ticket.

## Required interaction

`numeric-explorer`

Inputs:

- base value;
- percentage.

Output:

- percentage amount;
- optional visual proportion;
- accessible textual equivalent.

Must support touch and numeric keyboard.

## Critical misconception

For a R$2,400 item with 15% discount, R$360 is the discount amount, not the final price. The lesson must generate separate evidence for calculation and interpretation when possible.

## Exit ticket

- direct: compute a percentage;
- applied: discount/increase;
- transfer: contextual problem where the requested quantity is not stated as “calculate X%”.

## Regression purpose

Validates numeric input, explorer, guided practice, deterministic question evaluation, multi-Concept evidence, mobile touch behavior and review scheduling.
