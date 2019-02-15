module.exports = function(req, res, text, view) {
  res.render(view || "layout", {
    user: req.session.user,
    messages: [
      {
        text: text || "Some unknown error occurred...",
        color: "red darken-4"
      }
    ]
  });
};
