# Responsive v3

## Global rule

Student product is mobile-first.

Design and test in this order:

1. mobile;
2. tablet;
3. desktop.

Programming/code surfaces are the exception: they may progressively enhance strongly on wider screens while remaining usable on mobile.

## Mobile

- one primary region at a time;
- bottom navigation for top-level student destinations;
- secondary context in sheets/drawers;
- primary CTA may be sticky when it advances the active step;
- minimum touch target follows existing accessibility token (44px);
- no essential hover behavior;
- avoid horizontal scrolling except semantically wide technical content.

## Tablet

- increase content width;
- optionally expose secondary panel;
- drag interactions still retain tap/keyboard alternative.

## Desktop

- preserve the same student task hierarchy;
- lesson content remains a readable central column;
- optional contextual rail may show progress/help/notes;
- do not stretch mobile cards to the full viewport unnecessarily.

## Required recompositions

- timeline → vertical/stacked on narrow screens;
- comparison table → cards where tabular semantics are weak;
- admin dense tables may scroll or use desktop-first admin shell, but student tables recompose;
- contextual tutor → bottom sheet/drawer on mobile;
- assessment question navigator → compact sheet/grid.
