export function createDialogueBox() {
    const dialogueBox = add([
        rect(1920, 200),
        outline(5),
        pos(0, 1080),
        fixed(),
        color(255, 255, 255),
    ]);

    const content = dialogueBox.add([
        text("", {
            size: 42,
            width: 1820,
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
        pos(50, 30),
        fixed(),
    ]);

    return { dialogueBox, content };
}