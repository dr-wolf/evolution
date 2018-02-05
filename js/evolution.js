/**
 * Created by otto on 05.02.18.
 */

(function(){
    "use strict";

    const cell_size = 6;
    const genocode_length = 64;
    const bot_count = 500;

    function rand(max) {
        return Math.floor(Math.random() * max);
    }

    function norm(a, min, max) {
        if (a < min)
            return a + (max - min);
        else if (a >= max)
            return a - (max - min);
        else
            return a;
    }

    window.evolution = {
        field: {
            width: 64,
            height: 64,
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
            } while (this.field.cells[p.y][p.x] !== "ground");

            var c = [];
            var i;
            if (genocode) {
                for (i = 0; i < genocode.length; i++) {
                    c.push(genocode[i][rand(genocode[i].length)]);
                }
                for (i = 0; i < c.length / 4; i++) {
                    c[rand(c.length)] += norm(Math.random() > 0.5 ? 1 : -1, 0, 16);
                }
            } else {
                for (i = 0; i < 32; i++) {
                    c.push(rand(16));
                }
            }

            return {
                position: p,
                health: 100 + rand(100),
                code: {
                    bytes: [],
                    ip: 0
                },
                run: function(field) {
                    this.health--;
                    if (this.health <= 0) {
                        return false;
                    }
                    switch (this.code.bytes[this.code.ip]) {
                        case 0:
                            this.position.y = norm(this.position.y - 1, 0, field.height);
                            this.code.ip++;
                            break;
                        case 1:
                            this.position.x = norm(this.position.x + 1, 0, field.width);
                            this.code.ip++;
                            break;
                        case 2:
                            this.position.y = norm(this.position.y + 1, 0, field.height);
                            this.code.ip++;
                            break;
                        case 3:
                            this.position.x = norm(this.position.x - 1, 0, field.width);
                            this.code.ip++;
                            break;
                        case 4:
                            this.code.ip += jump(field.cells[this.position.y - 1][this.position.x]);
                            break;
                        case 5:
                            this.code.ip += jump(field.cells[this.position.y][this.position.x + 1]);
                            break;
                        case 6:
                            this.code.ip += jump(field.cells[this.position.y + 1][this.position.x]);
                            break;
                        case 7:
                            this.code.ip += jump(field.cells[this.position.y][this.position.x - 1]);
                            break;
                        default:
                            this.code.ip += norm(this.code.bytes[this.code.ip], 0, this.code.bytes.length);
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
            for (var i = 0; i < genocode_length; i++) {
                genocode[i] = [];
                for (var b = 0; b < this.bots.length; b++) {
                    genocode[i].push(this.bots[b].code.bytes[i]);
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
                    var p = Math.random();
                    if (p < 0.1)
                        this.field.cells[y].push('water');
                    else if (p < 0.4)
                        this.field.cells[y].push('grass');
                    else
                        this.field.cells[y].push('ground')
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