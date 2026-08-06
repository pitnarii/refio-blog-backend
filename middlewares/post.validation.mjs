const validateCreatePost = (req, res, next) => {
    console.log(req.body)
return res.status(400).json({error: "Invalid post data"})
}