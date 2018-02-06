/**
 * Created by otto on 05.02.18.
 */

(function(){
    "use strict";

    const cell_size = 6;
    const code_length = 32;
    const bot_count = 500;

    function rand(max) {
        return Math.floor(Math.random() * max);
    }

    function norm(a, max) {
        if (a < 0)
            return a + max;
        else if (a >= max)
            return a - max;
        else
            return a;
    }

    window.evolution = {
        field: {
            width: 128,
            height: 128,
            cells: []
        },

        bots: [],

        makeBot: function(genocode) {
            function jump(cell) {
                switch (cell) {
                    case "water":
                        return 1;
                    case "grass":
                        return 2;
                    case "ground":
                        return 3;
                }
            }

            var p = {x: 0, y: 0};
            do {
                p.x = rand(this.field.width);
                p.y = rand(this.field.height);
            } while (this.field.cells[p.y][p.x] === "water");

            var c = [];
            var i;
            if (genocode) {
                for (i = 0; i < genocode.length; i++) {
                    c.push(genocode[i][rand(genocode[i].length)]);
                }
                for (i = 0; i < c.length / 8; i++) {
                    c[rand(c.length)] += rand(code_length + 8) - 8;
                }
            } else {
                for (i = 0; i < code_length; i++) {
                    c.push(rand(code_length + 8) - 8);
                }
            }

            return {
                position: p,
                health: 50,
                code: c, //[-5, 4, 0, 0, -1, -6, 4, 0, 0, -2, -7, 4, 0, 0, -3, -8, 4, 0, 0, -4,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                run: function(field) {
                    this.health--;
                    if (this.health <= 0) {
                        return false;
                    }
                    var ip = 0;
                    for (var i = 0; i < 1000; i++) {
                        var c = this.code[ip];
                        switch (c) {
                            case 0:
                                ip = norm(ip + 1, code_length);
                                break;
                            case -1:
                                this.position.y = norm(this.position.y - 1, field.height);
                                ip = norm(ip + 1, code_length);
                                break;
                            case -2:
                                this.position.x = norm(this.position.x + 1, field.width);
                                ip = norm(ip + 1, code_length);
                                break;
                            case -3:
                                this.position.y = norm(this.position.y + 1, field.height);
                                ip = norm(ip + 1, code_length);
                                break;
                            case -4:
                                this.position.x = norm(this.position.x - 1, field.width);
                                ip = norm(ip + 1, code_length);
                                break;
                            case -5:
                                ip = norm(ip + jump(field.cells[norm(this.position.y - 1, field.height)][this.position.x]), this.code.length);
                                break;
                            case -6:
                                ip = norm(ip + jump(field.cells[this.position.y][norm(this.position.x + 1, field.width)]), this.code.length);
                                break;
                            case -7:
                                ip = norm(ip + jump(field.cells[norm(this.position.y + 1, field.height)][this.position.x]), this.code.length);
                                break;
                            case -8:
                                ip = norm(ip + jump(field.cells[this.position.y][norm(this.position.x - 1, field.width)]), this.code.length);
                                break;
                            default:
                                ip = norm(ip + c, code_length);
                        }
                        if (c >= -4 && c < 0) {
                            break;
                        }
                    }

                    switch (field.cells[this.position.y][this.position.x]) {
                        case "water":
                            return false;
                        case "grass":
                            field.cells[this.position.y][this.position.x] = "ground";
                            this.health += 25;
                    }
                    return true;
                }
            };
        },

        makeGenocode: function() {
            var genocode = [];
            for (var i = 0; i < code_length; i++) {
                genocode[i] = [];
                for (var b = 0; b < this.bots.length; b++) {
                    genocode[i].push(this.bots[b].code[i]);
                }
            }
            return genocode;
        },

        render: function(canvas) {
            function rect(ctx, x, y, w, h, c){
                ctx.fillStyle = c;
                ctx.fillRect(x, y, w, h);
            }

            function color(cells, x, y) {
                switch (cells[y][x]) {
                    case "water":
                        return "#08f";
                    case "grass":
                        return "#0c0";
                    case "ground":
                        return "#fc0";
                }
            }

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            const wp_base_x = Math.floor(canvas.width / 2 - this.field.width * cell_size / 2);
            const wp_base_y = Math.floor(canvas.height / 2 - this.field.height * cell_size / 2);

            var ctx = canvas.getContext("2d");

            rect(ctx, 0, 0, canvas.width, canvas.height, "#000");

            var py = wp_base_y;
            for (var y = 0; y < this.field.height; y++) {
                var px = wp_base_x;
                for (var x = 0; x < this.field.width; x++) {
                    rect(ctx, px, py, cell_size, cell_size, color(this.field.cells, x, y));
                    px += cell_size;
                }
                py += cell_size;
            }

            for (var i = 0; i < this.bots.length; i++) {
                rect(ctx,
                    wp_base_x + this.bots[i].position.x * cell_size + 1,
                    wp_base_y + this.bots[i].position.y * cell_size + 1,
                    cell_size - 2, cell_size - 2, "#800"
                );
            }
        },

        init: function() {
            this.field.cells = [];
            for (var y = 0; y < this.field.height; y++) {
                this.field.cells.push([]);
                for (var x = 0; x < this.field.width; x++) {
                    if (Math.sqrt((x - 64)*(x - 64) + (y - 64)*(y - 64)) > 63) {
                        this.field.cells[y].push('water');
                    } else {
                        var p = Math.random();
                        if (p < 0.1)
                            this.field.cells[y].push('water');
                        else if (p < 0.2)
                            this.field.cells[y].push('grass');
                        else
                            this.field.cells[y].push('ground');
                    }
                }
            }

            this.bots = [];
            for (var i = 0; i < bot_count; i++) {
                this.bots.push(this.makeBot());
            }

        },

        step: function() {
            for (var i = 0; i < this.bots.length; i++) {
                if (!this.bots[i].run(this.field)) {
                    if (this.field.cells[this.bots[i].position.y][this.bots[i].position.x] === "ground") {
                        this.field.cells[this.bots[i].position.y][this.bots[i].position.x] = "grass"
                    }
                    this.bots.splice(i, 1);
                }
                if (this.bots.length <= 8) {
                    var gc = this.makeGenocode();
                    while (this.bots.length < bot_count) {
                        this.bots.push(this.makeBot(gc));
                    }
                }
            }
        }
    };


})();