const express = require('express')
const auth = require("../middleware/auth")
const Task = require('../models/task')
const router = new express.Router()

router.post("/tasks", auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

//GET /tasks?completed=true(or false or none)  --for filtering
//GET /tasks?limit=2&skip=3  --for paging
//GET /tasks?sort=createAt:asc  --for sorting
router.get("/tasks", auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.completed) {
        match.completed = req.query.completed === "true"
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1
    }
    try {
        //any of the two can be used
        // const tasks = await Task.find({owner:req.user._id})
        // res.send(tasks)
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(404).send(e)
    }
})

router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task)
            return res.status(404).send(error)
        res.status(201).send(task)
    } catch (error) {
        res.status(404).send(error)
    }
})

router.patch("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const allowedFields = ['description', 'completed']
    const isValid = updates.every(update => allowedFields.includes(update))
    if (!isValid) {
        return res.status(400).send({ error: "Invalid Search" })
    }
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task)
            return res.status(404).send()
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })

        if (!task)
            return res.status(404).send({ error: "Task not found" })
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router