export function createDialogueBox() {
    const dialogueBox = add([
        rect(1280, 200),
        outline(5),
        pos(0, 520),
        fixed(),
        color(255, 255, 255),
    ]);

    const content = dialogueBox.add([
        text("", {
            size: 42,
            width: 1200,
            lineSpacing: 15,
            styles: {
                "selected": { 
                    color: rgb(34, 210, 10),
                    font: "sinko",
                    size: 80,
                },
            },
        }),
        color(10, 10, 10),
        pos(40, 30),
        fixed(),
    ]);

    return { dialogueBox, content };
}