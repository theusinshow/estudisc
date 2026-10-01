# 02 — Curriculum

Status: **Accepted**
Source of truth for: top-level IFSC Track decomposition.

## Core hierarchy

`Track → Module → Lesson → Concept`

For this Track:

- Track: `IFSC 2027`
- Module `MAT`: Matemática
- Module `POR`: Língua Portuguesa
- Module `CIE`: Ciências
- Module `GH`: Geografia e História

A Concept is the smallest mastery target. Do not create a parallel `Skill` mastery aggregate.

## Target lesson structure

### Mathematics — ~18 lessons

1. Numbers and operations
2. Divisibility, primes, MMC/MDC
3. Fractions
4. Decimals and scientific notation
5. Ratio and proportion
6. Rule of three
7. Percentage
8. Percentage applications and interest
9. Powers, radicals and numeric expressions
10. Inequalities and intervals
11. Algebraic expressions and monomials
12. Polynomials, notable products and factorization
13. First-degree equations
14. Systems of equations
15. Second-degree equations
16. Units, perimeter and area
17. Volumes and right-triangle metric relations
18. Tables, graphs, probability and counting

### Portuguese — ~10 lessons

1. Comprehension and inference
2. Genres, purpose, context and authorship
3. Cohesion, coherence and discourse operators
4. Argumentation and intentionality
5. Semantics, synonymy and ambiguity
6. Figures of speech and meaning effects
7. Intertextuality and literary resources
8. Linguistic variation and prejudice
9. Morphology, inflections and written conventions
10. Syntax, voices, agreement and government/regency

Grammar is taught primarily as a tool for interpreting and producing meaning in text.

### Geography and History — ~18 lessons

1. Geographic space, cartography, time and historical sources
2. Social formation of Santa Catarina
3. Santa Catarina territory and Contestado
4. Regions, economy, population and environment of Santa Catarina
5. Indigenous peoples, territory and Colonial Brazil
6. Slavery and resistance
7. Independence and the Brazilian Empire
8. Abolition and Republic
9. Old Republic and Vargas Era
10. Post-war Brazil and dictatorship
11. Redemocratization and contemporary Brazil
12. Brazilian economic/population geography
13. Capitalism, globalization, work and inequality
14. Antiquity and Middle Ages
15. Renaissance, National States and Reformation
16. Maritime expansion, Enlightenment and revolutions
17. Industrialization, imperialism and World Wars
18. Cold War, decolonization, resistance and Human Rights

### Science — ~20–21 lessons

1. Motion and simple machines
2. Energy and transformations
3. Heat and thermodynamics
4. Electricity and circuits
5. Matter and physical states
6. Atomic structure
7. Periodic table, elements, molecules and substances
8. Mixtures and separation
9. Chemical transformations and reactions
10. Cells
11. Metabolism, DNA, genes and chromosomes
12. Mitosis, meiosis and gametogenesis
13. Ecology and ecosystems
14. Biodiversity, environment and sustainability
15. Genetics and biotechnology
16. Diversity of living beings
17. Human body and systems
18. Health, vaccines, senses and psychoactive substances
19. Human reproduction, contraception and STIs
20. Biological evolution
21. Astronomy (may remain separate from Evolution to preserve coherent pedagogy)

## Completion rule

The number of Lessons is not the completeness metric. Completeness means:

- every atomic official CurriculumRequirement is mapped;
- mapped Concepts are taught;
- Concepts have assessment coverage;
- content passes QA.

Detailed subject decomposition lives under `curriculum/`.
