import net from "net";
export default (connection) => {
    let arr = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]);
    connection.write(arr);
    // connection.flush();
};
